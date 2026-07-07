import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { StageType } from '@prisma/client';

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
    const { stage, note } = await request.json();

    if (!stage) {
      return NextResponse.json({ message: 'Stage is required' }, { status: 400 });
    }

    if (!Object.values(StageType).includes(stage)) {
      return NextResponse.json({ message: 'Invalid StageType' }, { status: 400 });
    }

    // Verify application ownership
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        stages: {
          where: { leftAt: null },
          take: 1,
        },
      },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // If stage is already the current stage, do nothing
    if (application.currentStage === stage) {
      return NextResponse.json({ message: 'Application is already in this stage', application }, { status: 200 });
    }

    const now = new Date();

    // Determine updates to appliedAt
    const updateData: { currentStage: StageType; appliedAt?: Date } = {
      currentStage: stage as StageType,
    };
    
    // Set appliedAt if entering APPLIED or later and not set yet
    if (!application.appliedAt && stage !== StageType.WATCHING && stage !== StageType.PREPARED) {
      updateData.appliedAt = now;
    }

    // Run transaction:
    // 1. Close current stage (leftAt = now)
    // 2. Create new stage record
    // 3. Update job application state
    await prisma.$transaction(async (tx) => {
      // Close active stages
      await tx.applicationStage.updateMany({
        where: {
          applicationId: id,
          leftAt: null,
        },
        data: {
          leftAt: now,
        },
      });

      // Create new stage
      await tx.applicationStage.create({
        data: {
          applicationId: id,
          stage: stage as StageType,
          note: note || `Moved to ${stage}`,
          enteredAt: now,
        },
      });

      // Update application
      await tx.jobApplication.update({
        where: { id },
        data: updateData,
      });
    });

    const updatedApplication = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { enteredAt: 'desc' } },
      },
    });

    return NextResponse.json({ application: updatedApplication }, { status: 200 });
  } catch (error) {
    console.error('Change stage error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
