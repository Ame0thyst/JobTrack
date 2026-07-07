import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { StageType, SourcePlatform } from '@prisma/client';

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
          orderBy: { enteredAt: 'asc' },
        },
      },
    });

    const totalApplications = applications.length;
    const totalOffers = applications.filter((app) => app.currentStage === StageType.OFFER).length;
    const totalRejected = applications.filter((app) => app.currentStage === StageType.REJECTED).length;

    // Success rate formula: offers / total_applications (percentage)
    const successRate = totalApplications > 0 ? (totalOffers / totalApplications) * 100 : 0;

    // Average Response Time calculation:
    // Time from entering APPLIED to entering the next stage (any stage other than WATCHING, PREPARED, APPLIED)
    let totalResponseTimeMs = 0;
    let responsiveAppsCount = 0;
    let pendingResponseCount = 0;

    applications.forEach((app) => {
      const stages = app.stages;
      const appliedStageIndex = stages.findIndex((s) => s.stage === StageType.APPLIED);

      if (appliedStageIndex !== -1) {
        const appliedStage = stages[appliedStageIndex];
        // Find the first stage change *after* the APPLIED stage
        const nextStage = stages.slice(appliedStageIndex + 1).find(
          (s) => s.stage !== StageType.WATCHING && s.stage !== StageType.PREPARED && s.stage !== StageType.APPLIED
        );

        if (nextStage) {
          const diffMs = new Date(nextStage.enteredAt).getTime() - new Date(appliedStage.enteredAt).getTime();
          if (diffMs > 0) {
            totalResponseTimeMs += diffMs;
            responsiveAppsCount++;
          }
        } else {
          // Applied but no response yet
          pendingResponseCount++;
        }
      }
    });

    // Average response time in days
    const avgResponseTimeDays =
      responsiveAppsCount > 0 ? totalResponseTimeMs / (1000 * 60 * 60 * 24 * responsiveAppsCount) : null;

    // Response Rate calculation: (responsive / total applied)
    const totalApplied = applications.filter(
      (app) => app.appliedAt !== null || app.currentStage === StageType.APPLIED
    ).length;

    // Platform Breakdown
    const platformBreakdown: Record<string, { count: number; offers: number; conversionRate: number }> = {};
    Object.values(SourcePlatform).forEach((p) => {
      platformBreakdown[p] = { count: 0, offers: 0, conversionRate: 0 };
    });

    applications.forEach((app) => {
      const p = app.sourcePlatform;
      if (!platformBreakdown[p]) {
        platformBreakdown[p] = { count: 0, offers: 0, conversionRate: 0 };
      }
      platformBreakdown[p].count++;
      if (app.currentStage === StageType.OFFER) {
        platformBreakdown[p].offers++;
      }
    });

    Object.keys(platformBreakdown).forEach((p) => {
      const data = platformBreakdown[p];
      data.conversionRate = data.count > 0 ? (data.offers / data.count) * 100 : 0;
    });

    // Funnel calculations
    const funnel = {
      saved: totalApplications,
      applied: applications.filter(
        (app) => app.appliedAt !== null || (app.currentStage !== StageType.WATCHING && app.currentStage !== StageType.PREPARED)
      ).length,
      interview: applications.filter((app) =>
        app.stages.some(
          (s) =>
            s.stage === StageType.HR_SCREENING ||
            s.stage === StageType.INTERVIEW_1 ||
            s.stage === StageType.INTERVIEW_2 ||
            s.stage === StageType.REVIEW
        )
      ).length,
      offer: totalOffers,
    };

    // Timing Analysis (Best day of week and best hour)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekCount: Record<string, number> = {};
    const hourOfDayCount: Record<number, number> = {};

    daysOfWeek.forEach((d) => (dayOfWeekCount[d] = 0));
    for (let h = 0; h < 24; h++) hourOfDayCount[h] = 0;

    applications.forEach((app) => {
      const date = app.appliedAt || app.createdAt;
      if (date) {
        const d = new Date(date);
        const dayName = daysOfWeek[d.getDay()];
        const hour = d.getHours();

        dayOfWeekCount[dayName]++;
        hourOfDayCount[hour]++;
      }
    });

    // Suppress unused variable warning
    void totalApplied;

    return NextResponse.json(
      {
        totalApplications,
        totalOffers,
        totalRejected,
        successRate: Math.round(successRate * 10) / 10,
        avgResponseTime: avgResponseTimeDays !== null ? Math.round(avgResponseTimeDays * 10) / 10 : null,
        pendingResponseCount,
        platformBreakdown,
        timingAnalysis: {
          dayOfWeek: dayOfWeekCount,
          hourOfDay: hourOfDayCount,
        },
        funnel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
