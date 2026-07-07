import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// POST: Create a contact for a job application
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, email, phone, linkedinUrl, notes } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    // Verify ownership of the application
    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const contact = await prisma.contact.create({
      data: {
        applicationId: id,
        name,
        role: role || null,
        email: email || null,
        phone: phone || null,
        linkedinUrl: linkedinUrl || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch contacts for a job application
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership of the application
    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const contacts = await prisma.contact.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
