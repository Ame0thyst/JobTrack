import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ReminderType } from '@prisma/client';

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        application: {
          userId: userSession.userId,
        },
      },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
      orderBy: { remindAt: 'asc' },
    });

    return NextResponse.json({ reminders }, { status: 200 });
  } catch (error) {
    console.error('Fetch reminders error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, type, remindAt } = await request.json();

    if (!applicationId || !type || !remindAt) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Validate ReminderType enum
    if (!Object.values(ReminderType).includes(type)) {
      return NextResponse.json({ message: 'Invalid reminder type. Must be one of: FOLLOW_UP, INTERVIEW, DEADLINE, OTHER' }, { status: 400 });
    }

    // Verify ownership of the application
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        applicationId,
        type: type as ReminderType,
        remindAt: new Date(remindAt),
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('Create reminder error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { reminderId, isCompleted } = await request.json();

    if (!reminderId) {
      return NextResponse.json({ message: 'Reminder ID is required' }, { status: 400 });
    }

    // Verify ownership
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        application: true,
      },
    });

    if (!reminder || reminder.application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        isCompleted: !!isCompleted,
      },
    });

    return NextResponse.json({ reminder: updated }, { status: 200 });
  } catch (error) {
    console.error('Update reminder error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
