import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const userSession = await getCurrentUser();

    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId: userSession.userId },
      select: {
        companyName: true,
        location: true,
        companyLogo: true,
        companyWebsite: true,
        companyIndustry: true,
        companyDescription: true,
        companyFounded: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate companies by name (case-insensitive)
    const uniqueCompaniesMap = new Map<string, { 
      companyName: string; 
      location: string | null; 
      companyLogo: string | null;
      companyWebsite: string | null;
      companyIndustry: string | null;
      companyDescription: string | null;
      companyFounded: string | null;
    }>();
    
    for (const app of applications) {
      if (!app.companyName) continue;
      const normalized = app.companyName.trim().toLowerCase();
      if (!uniqueCompaniesMap.has(normalized)) {
        uniqueCompaniesMap.set(normalized, {
          companyName: app.companyName.trim(),
          location: app.location || null,
          companyLogo: app.companyLogo || null,
          companyWebsite: app.companyWebsite || null,
          companyIndustry: app.companyIndustry || null,
          companyDescription: app.companyDescription || null,
          companyFounded: app.companyFounded || null,
        });
      }
    }

    const companies = Array.from(uniqueCompaniesMap.values());

    return NextResponse.json({ companies }, { status: 200 });
  } catch (error) {
    console.error('Fetch unique companies error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userSession = await getCurrentUser();

    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      companyName,
      companyLogo,
      location,
      companyWebsite,
      companyIndustry,
      companyDescription,
      companyFounded
    } = await request.json();

    if (!companyName) {
      return NextResponse.json({ message: 'companyName is required' }, { status: 400 });
    }

    // Fetch all user applications to match case-insensitively and trim-insensitively
    const userApplications = await prisma.jobApplication.findMany({
      where: { userId: userSession.userId },
      select: { id: true, companyName: true },
    });

    const targetKey = companyName.trim().toLowerCase();
    const matchingIds = userApplications
      .filter((app) => app.companyName.trim().toLowerCase() === targetKey)
      .map((app) => app.id);

    if (matchingIds.length > 0) {
      await prisma.jobApplication.updateMany({
        where: {
          id: { in: matchingIds },
        },
        data: {
          companyLogo: companyLogo !== undefined ? companyLogo : null,
          location: location !== undefined ? location : null,
          companyWebsite: companyWebsite !== undefined ? companyWebsite : null,
          companyIndustry: companyIndustry !== undefined ? companyIndustry : null,
          companyDescription: companyDescription !== undefined ? companyDescription : null,
          companyFounded: companyFounded !== undefined ? companyFounded : null,
        },
      });
    }

    return NextResponse.json({ message: 'Company profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update company profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
