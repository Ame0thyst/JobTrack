import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { JobType, StageType, SourcePlatform } from '@prisma/client';

export async function GET() {
  try {
    const userSession = await getCurrentUser();

    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId: userSession.userId },
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
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    console.error('Fetch applications error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();

    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      companyName,
      companyLogo,
      companyWebsite,
      companyIndustry,
      companyDescription,
      companyFounded,
      roleTitle,
      jobType,
      location,
      jobUrl,
      sourcePlatform,
      currentStage = StageType.WATCHING,
      cardColor,
      resumeId,
      appliedAt,
      // Salary Tracker
      salaryMin,
      salaryMax,
      salaryCurrency = 'IDR',
      benefits,
      // Job Description
      jobDescription,
    } = await request.json();

    if (!companyName || !roleTitle || !jobType || !sourcePlatform) {
      return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
    }

    // Validate enum types
    if (!Object.values(JobType).includes(jobType)) {
      return NextResponse.json({ message: 'Invalid JobType' }, { status: 400 });
    }
    if (!Object.values(SourcePlatform).includes(sourcePlatform)) {
      return NextResponse.json({ message: 'Invalid SourcePlatform' }, { status: 400 });
    }
    if (!Object.values(StageType).includes(currentStage)) {
      return NextResponse.json({ message: 'Invalid StageType' }, { status: 400 });
    }

    // Parse appliedAt if present, or set it if the currentStage is APPLIED or later
    let parsedAppliedAt = appliedAt ? new Date(appliedAt) : null;
    if (!parsedAppliedAt && currentStage !== StageType.WATCHING && currentStage !== StageType.PREPARED) {
      parsedAppliedAt = new Date();
    }

    const application = await prisma.jobApplication.create({
      data: {
        userId: userSession.userId,
        companyName,
        companyLogo,
        companyWebsite,
        companyIndustry,
        companyDescription,
        companyFounded,
        roleTitle,
        jobType: jobType as JobType,
        location,
        jobUrl,
        sourcePlatform: sourcePlatform as SourcePlatform,
        currentStage: currentStage as StageType,
        cardColor: cardColor || null,
        resumeId: resumeId || null,
        appliedAt: parsedAppliedAt,
        // Salary fields
        salaryMin: salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : null,
        salaryMax: salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : null,
        salaryCurrency: salaryCurrency || 'IDR',
        benefits: benefits || null,
        // Job Description Archiver
        jobDescription: jobDescription || null,
        stages: {
          create: {
            stage: currentStage as StageType,
            note: 'Initial stage transition',
          },
        },
      },
      include: {
        stages: true,
        contacts: true,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
