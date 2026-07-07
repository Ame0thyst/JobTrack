import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.SMOKE_PORT || 3407);
let baseUrl = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${port}`;
const nextBin = join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  updateFrom(response) {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie')]
        : [];

    for (const cookieHeader of setCookies) {
      if (!cookieHeader) continue;

      const [nameValue] = cookieHeader.split(';');
      const separatorIndex = nameValue.indexOf('=');

      if (separatorIndex === -1) continue;

      const name = nameValue.slice(0, separatorIndex).trim();
      const value = nameValue.slice(separatorIndex + 1).trim();

      if (!name) continue;

      if (!value) {
        this.cookies.delete(name);
        continue;
      }

      this.cookies.set(name, value);
    }
  }

  clear() {
    this.cookies.clear();
  }

  toHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

function startServer() {
  return spawn(process.execPath, [nextBin, 'dev', '--port', String(port)], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForServer(serverProcess) {
  let stderr = '';
  let stdout = '';

  serverProcess.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  serverProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  for (let attempt = 0; attempt < 90; attempt++) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Dev server exited early.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
    }

    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: 'manual' });
      if (response.status === 200) {
        return;
      }
    } catch {
      // Keep polling until the server responds.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for dev server at ${baseUrl}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
}

async function isServerReady(candidateBaseUrl) {
  try {
    const response = await fetch(`${candidateBaseUrl}/login`, { redirect: 'manual' });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function request(jar, path, options = {}) {
  const {
    method = 'GET',
    body,
    expectedStatus,
    redirect = 'manual',
    headers = {},
  } = options;

  const cookieHeader = jar.toHeader();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    redirect,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  jar.updateFrom(response);

  if (expectedStatus !== undefined) {
    assert.equal(
      response.status,
      expectedStatus,
      `${method} ${path} returned ${response.status}, expected ${expectedStatus}`
    );
  }

  return response;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Expected JSON response but received:\n${text}`);
  }
}

async function main() {
  const jar = new CookieJar();
  let serverProcess = null;

  const stopServer = () => {
    if (serverProcess && serverProcess.exitCode === null) {
      serverProcess.kill();
    }
  };

  process.on('SIGINT', () => {
    stopServer();
    process.exit(130);
  });

  process.on('SIGTERM', () => {
    stopServer();
    process.exit(143);
  });

  try {
    if (!process.env.SMOKE_BASE_URL && await isServerReady('http://127.0.0.1:3000')) {
      baseUrl = 'http://127.0.0.1:3000';
    } else if (!(await isServerReady(baseUrl))) {
      serverProcess = startServer();
      await waitForServer(serverProcess);
    }

    const uniqueSuffix = Date.now();
    const name = 'Smoke Test User';
    const email = `smoke-${uniqueSuffix}@jobtrack.local`;
    const password = `SmokePass-${uniqueSuffix}`;

    let response = await request(jar, '/api/auth/me', { expectedStatus: 401 });
    let payload = await readJson(response);
    assert.equal(payload.message, 'Unauthorized');

    response = await request(jar, '/login', { expectedStatus: 200 });
    assert.match(await response.text(), /Welcome Back/i);

    response = await request(jar, '/', { expectedStatus: 307 });
    assert.match(response.headers.get('location') || '', /\/login$/);

    response = await request(jar, '/api/auth/register', {
      method: 'POST',
      expectedStatus: 201,
      body: { name, email, password },
    });
    payload = await readJson(response);
    assert.equal(payload.user.email, email);

    response = await request(jar, '/api/auth/me', { expectedStatus: 200 });
    payload = await readJson(response);
    assert.equal(payload.user.email, email);

    for (const protectedPath of ['/', '/applications', '/kanban', '/resumes', '/analytics', '/settings']) {
      response = await request(jar, protectedPath, { expectedStatus: 200 });
      const html = await response.text();
      assert.match(html, /JobTrack/i, `Expected protected page ${protectedPath} to render app shell`);
    }

    response = await request(jar, '/api/applications', { expectedStatus: 200 });
    payload = await readJson(response);
    assert.deepEqual(payload.applications, []);

    response = await request(jar, '/api/resumes', {
      method: 'POST',
      expectedStatus: 201,
      body: {
        title: 'Smoke Resume',
        version: 1,
        content: 'Created by smoke test',
      },
    });
    payload = await readJson(response);
    const resumeId = payload.resume.id;
    assert.equal(payload.resume.title, 'Smoke Resume');

    response = await request(jar, '/api/resumes', { expectedStatus: 200 });
    payload = await readJson(response);
    assert.equal(payload.resumes.length, 1);
    assert.equal(payload.resumes[0].id, resumeId);

    response = await request(jar, '/api/applications', {
      method: 'POST',
      expectedStatus: 201,
      body: {
        companyName: 'Smoke Company',
        roleTitle: 'QA Engineer',
        jobType: 'FULL_TIME',
        sourcePlatform: 'LINKEDIN',
        currentStage: 'APPLIED',
        location: 'Remote',
        jobUrl: 'https://example.com/jobs/smoke',
        resumeId,
      },
    });
    payload = await readJson(response);
    const applicationId = payload.application.id;
    assert.equal(payload.application.currentStage, 'APPLIED');
    assert.equal(payload.application.stages[0].stage, 'APPLIED');

    response = await request(jar, `/applications/${applicationId}`, { expectedStatus: 200 });
    assert.match(await response.text(), /JobTrack|Searching for application details/i);

    response = await request(jar, `/api/applications/${applicationId}`, { expectedStatus: 200 });
    payload = await readJson(response);
    assert.equal(payload.application.resume.id, resumeId);

    response = await request(jar, `/api/applications/${applicationId}`, {
      method: 'PUT',
      expectedStatus: 200,
      body: {
        location: 'Jakarta',
        sourcePlatform: 'COMPANY_WEBSITE',
        jobUrl: 'https://example.com/jobs/smoke-updated',
      },
    });
    payload = await readJson(response);
    assert.equal(payload.application.location, 'Jakarta');
    assert.equal(payload.application.sourcePlatform, 'COMPANY_WEBSITE');

    response = await request(jar, `/api/applications/${applicationId}/notes`, {
      method: 'POST',
      expectedStatus: 201,
      body: { content: 'Smoke note' },
    });
    payload = await readJson(response);
    assert.equal(payload.note.content, 'Smoke note');

    response = await request(jar, '/api/reminders', {
      method: 'POST',
      expectedStatus: 201,
      body: {
        applicationId,
        type: 'FOLLOW_UP',
        remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    payload = await readJson(response);
    const reminderId = payload.reminder.id;
    assert.equal(payload.reminder.isCompleted, false);

    response = await request(jar, '/api/reminders', { expectedStatus: 200 });
    payload = await readJson(response);
    assert.equal(payload.reminders.length, 1);
    assert.equal(payload.reminders[0].id, reminderId);

    response = await request(jar, '/api/reminders', {
      method: 'PATCH',
      expectedStatus: 200,
      body: {
        reminderId,
        isCompleted: true,
      },
    });
    payload = await readJson(response);
    assert.equal(payload.reminder.isCompleted, true);

    response = await request(jar, `/api/applications/${applicationId}/stages`, {
      method: 'POST',
      expectedStatus: 200,
      body: {
        stage: 'INTERVIEW_1',
        note: 'Smoke stage transition',
      },
    });
    payload = await readJson(response);
    assert.equal(payload.application.currentStage, 'INTERVIEW_1');
    assert.equal(payload.application.stages[0].stage, 'INTERVIEW_1');

    response = await request(jar, '/api/analytics', { expectedStatus: 200 });
    payload = await readJson(response);
    assert.equal(payload.totalApplications, 1);
    assert.ok(payload.platformBreakdown.COMPANY_WEBSITE.count >= 1);

    response = await request(jar, '/api/auth/logout', {
      method: 'POST',
      expectedStatus: 200,
    });
    payload = await readJson(response);
    assert.equal(payload.message, 'Logged out successfully');

    response = await request(jar, '/api/auth/me', { expectedStatus: 401 });
    payload = await readJson(response);
    assert.equal(payload.message, 'Unauthorized');

    response = await request(jar, '/api/auth/login', {
      method: 'POST',
      expectedStatus: 200,
      body: { email, password },
    });
    payload = await readJson(response);
    assert.equal(payload.user.email, email);

    response = await request(jar, `/api/applications/${applicationId}`, {
      method: 'DELETE',
      expectedStatus: 200,
    });
    payload = await readJson(response);
    assert.equal(payload.message, 'Application deleted successfully');

    response = await request(jar, '/api/applications', { expectedStatus: 200 });
    payload = await readJson(response);
    assert.equal(payload.applications.length, 0);

    console.log('Smoke test passed: auth, pages, applications, notes, reminders, resumes, analytics, and logout are connected.');
  } finally {
    stopServer();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
