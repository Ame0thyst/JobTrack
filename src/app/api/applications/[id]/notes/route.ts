import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content, type = 'GENERAL', title } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    // Verify ownership
    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const note = await prisma.applicationNote.create({
      data: {
        applicationId: id,
        content: content.trim(),
        type: type || 'GENERAL',
        title: title || null,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
