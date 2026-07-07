import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { JobType, SourcePlatform, StageType } from '@prisma/client';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { enteredAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: {
          orderBy: { remindAt: 'asc' },
        },
        contacts: {
          orderBy: { createdAt: 'desc' },
        },
        resume: true,
      },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application }, { status: 200 });
  } catch (error) {
    console.error('Fetch application error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const data = await request.json();
    let invalidateAiCache = false;

    // Fields that can be directly updated
    const updateData: Partial<{
      companyName: string;
      companyLogo: string | null;
      companyWebsite: string | null;
      companyIndustry: string | null;
      companyDescription: string | null;
      companyFounded: string | null;
      roleTitle: string;
      location: string | null;
      jobUrl: string | null;
      resumeId: string | null;
      cardColor: string | null;
      jobType: JobType;
      sourcePlatform: SourcePlatform;
      appliedAt: Date | null;
      // Salary fields
      salaryMin: number | null;
      salaryMax: number | null;
      salaryCurrency: string;
      benefits: string | null;
      // Job Description Archiver
      jobDescription: string | null;
      // AI Cache invalidation
      aiMatchAnalysis: string | null;
    }> = {};

    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.companyLogo !== undefined) updateData.companyLogo = data.companyLogo;
    if (data.companyWebsite !== undefined) updateData.companyWebsite = data.companyWebsite;
    if (data.companyIndustry !== undefined) updateData.companyIndustry = data.companyIndustry;
    if (data.companyDescription !== undefined) updateData.companyDescription = data.companyDescription;
    if (data.companyFounded !== undefined) updateData.companyFounded = data.companyFounded;
    if (data.roleTitle !== undefined) updateData.roleTitle = data.roleTitle;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl;
    if (data.cardColor !== undefined) updateData.cardColor = data.cardColor || null;

    if (data.resumeId !== undefined) {
      updateData.resumeId = data.resumeId || null;
      invalidateAiCache = true;
    }

    if (data.jobType !== undefined) {
      if (!Object.values(JobType).includes(data.jobType)) {
        return NextResponse.json({ message: 'Invalid JobType' }, { status: 400 });
      }
      updateData.jobType = data.jobType as JobType;
    }

    if (data.sourcePlatform !== undefined) {
      if (!Object.values(SourcePlatform).includes(data.sourcePlatform)) {
        return NextResponse.json({ message: 'Invalid SourcePlatform' }, { status: 400 });
      }
      updateData.sourcePlatform = data.sourcePlatform as SourcePlatform;
    }

    if (data.appliedAt !== undefined) {
      updateData.appliedAt = data.appliedAt ? new Date(data.appliedAt) : null;
    }

    // Salary inputs
    if (data.salaryMin !== undefined) {
      updateData.salaryMin = data.salaryMin !== null && data.salaryMin !== '' ? Number(data.salaryMin) : null;
    }
    if (data.salaryMax !== undefined) {
      updateData.salaryMax = data.salaryMax !== null && data.salaryMax !== '' ? Number(data.salaryMax) : null;
    }
    if (data.salaryCurrency !== undefined) {
      updateData.salaryCurrency = data.salaryCurrency || 'IDR';
    }
    if (data.benefits !== undefined) {
      updateData.benefits = data.benefits || null;
    }

    // Job Description
    if (data.jobDescription !== undefined) {
      updateData.jobDescription = data.jobDescription || null;
      invalidateAiCache = true;
    }

    // Invalidate AI Cache if resume or job description has changed
    if (invalidateAiCache) {
      updateData.aiMatchAnalysis = null;
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ application: updatedApplication }, { status: 200 });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application || application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // Delete cascading dependencies first (stages, notes, reminders, contacts)
    await prisma.$transaction([
      prisma.applicationStage.deleteMany({ where: { applicationId: id } }),
      prisma.applicationNote.deleteMany({ where: { applicationId: id } }),
      prisma.reminder.deleteMany({ where: { applicationId: id } }),
      prisma.contact.deleteMany({ where: { applicationId: id } }),
      prisma.jobApplication.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: 'Application deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
