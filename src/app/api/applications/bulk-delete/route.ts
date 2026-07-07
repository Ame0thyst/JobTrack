import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Invalid or empty IDs list' }, { status: 400 });
    }

    // Verify all applications belong to the current user
    const userAppsCount = await prisma.jobApplication.count({
      where: {
        id: { in: ids },
        userId: userSession.userId,
      },
    });

    if (userAppsCount !== ids.length) {
      return NextResponse.json({ message: 'One or more applications not found or unauthorized' }, { status: 403 });
    }

    // Delete cascading dependencies in a single transaction
    await prisma.$transaction([
      prisma.applicationStage.deleteMany({
        where: { applicationId: { in: ids } },
      }),
      prisma.applicationNote.deleteMany({
        where: { applicationId: { in: ids } },
      }),
      prisma.reminder.deleteMany({
        where: { applicationId: { in: ids } },
      }),
      prisma.contact.deleteMany({
        where: { applicationId: { in: ids } },
      }),
      prisma.jobApplication.deleteMany({
        where: {
          id: { in: ids },
          userId: userSession.userId,
        },
      }),
    ]);

    return NextResponse.json({ message: 'Applications bulk deleted successfully', count: ids.length }, { status: 200 });
  } catch (error) {
    console.error('Bulk delete applications error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
