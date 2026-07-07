import { PrismaClient, JobType, StageType, SourcePlatform } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records
  await prisma.reminder.deleteMany();
  await prisma.applicationNote.deleteMany();
  await prisma.applicationStage.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });
  console.log('Created user:', user.email);

  // 3. Create Resumes
  const resume1 = await prisma.resume.create({
    data: {
      userId: user.id,
      title: 'Fullstack Next.js Developer Resume',
      version: 1,
      content: 'Experienced in Next.js, React, Node.js, Prisma, and PostgreSQL. Focused on building responsive, glassmorphic dashboards.',
    },
  });

  const resume2 = await prisma.resume.create({
    data: {
      userId: user.id,
      title: 'Senior Frontend Engineer Profile',
      version: 2,
      content: 'Frontend specialist. 5+ years of experience with React, TailwindCSS, CSS animations, and TypeScript.',
    },
  });
  console.log('Created resumes.');

  // 4. Create Job Applications
  // Application 1: Google (Offer)
  const appGoogle = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      companyName: 'Google',
      roleTitle: 'Software Engineer',
      jobType: JobType.FULL_TIME,
      location: 'Mountain View, CA',
      jobUrl: 'https://careers.google.com',
      sourcePlatform: SourcePlatform.COMPANY_WEBSITE,
      currentStage: StageType.OFFER,
      resumeId: resume1.id,
      appliedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  });

  // Stages history for Google
  const tGoogle = appGoogle.appliedAt!.getTime();
  await prisma.applicationStage.createMany({
    data: [
      { applicationId: appGoogle.id, stage: StageType.WATCHING, enteredAt: new Date(tGoogle - 5 * 24 * 60 * 60 * 1000), leftAt: new Date(tGoogle - 3 * 24 * 60 * 60 * 1000), note: 'Saved opportunity' },
      { applicationId: appGoogle.id, stage: StageType.PREPARED, enteredAt: new Date(tGoogle - 3 * 24 * 60 * 60 * 1000), leftAt: new Date(tGoogle), note: 'Resume customized and reviewed' },
      { applicationId: appGoogle.id, stage: StageType.APPLIED, enteredAt: new Date(tGoogle), leftAt: new Date(tGoogle + 4 * 24 * 60 * 60 * 1000), note: 'Submitted via careers portal' },
      { applicationId: appGoogle.id, stage: StageType.HR_SCREENING, enteredAt: new Date(tGoogle + 4 * 24 * 60 * 60 * 1000), leftAt: new Date(tGoogle + 10 * 24 * 60 * 60 * 1000), note: '30 min call with recruiter. Went well!' },
      { applicationId: appGoogle.id, stage: StageType.INTERVIEW_1, enteredAt: new Date(tGoogle + 10 * 24 * 60 * 60 * 1000), leftAt: new Date(tGoogle + 18 * 24 * 60 * 60 * 1000), note: 'Technical screen: coding and algorithms' },
      { applicationId: appGoogle.id, stage: StageType.INTERVIEW_2, enteredAt: new Date(tGoogle + 18 * 24 * 60 * 60 * 1000), leftAt: new Date(tGoogle + 25 * 24 * 60 * 60 * 1000), note: 'Onsite rounds: system design and behavioral' },
      { applicationId: appGoogle.id, stage: StageType.OFFER, enteredAt: new Date(tGoogle + 25 * 24 * 60 * 60 * 1000), note: 'Received verbal offer!' },
    ],
  });

  // Notes for Google
  await prisma.applicationNote.createMany({
    data: [
      { applicationId: appGoogle.id, content: 'Preparation checklist:\n- Focus on dynamic programming\n- Study system design patterns (caching, load balancers)\n- Prepare stories for behavioral questions using STAR method', createdAt: new Date(tGoogle - 3 * 24 * 60 * 60 * 1000) },
      { applicationId: appGoogle.id, content: 'Recruiter: Sarah Jenkins (sarah.jenkins@google.com)\nSalary range: $140,000 - $180,000 base + equity', createdAt: new Date(tGoogle + 4 * 24 * 60 * 60 * 1000) },
    ],
  });


  // Application 2: Stripe (Interview 1)
  const appStripe = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      companyName: 'Stripe',
      roleTitle: 'Frontend Engineer',
      jobType: JobType.FULL_TIME,
      location: 'Remote, US',
      jobUrl: 'https://stripe.com/jobs',
      sourcePlatform: SourcePlatform.LINKEDIN,
      currentStage: StageType.INTERVIEW_1,
      resumeId: resume2.id,
      appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    },
  });

  // Stages for Stripe
  const tStripe = appStripe.appliedAt!.getTime();
  await prisma.applicationStage.createMany({
    data: [
      { applicationId: appStripe.id, stage: StageType.PREPARED, enteredAt: new Date(tStripe - 1 * 24 * 60 * 60 * 1000), leftAt: new Date(tStripe), note: 'Ready to apply' },
      { applicationId: appStripe.id, stage: StageType.APPLIED, enteredAt: new Date(tStripe), leftAt: new Date(tStripe + 6 * 24 * 60 * 60 * 1000), note: 'LinkedIn Easy Apply' },
      { applicationId: appStripe.id, stage: StageType.INTERVIEW_1, enteredAt: new Date(tStripe + 6 * 24 * 60 * 60 * 1000), note: 'Debugging and integration interview' },
    ],
  });

  // Reminders for Stripe
  await prisma.reminder.create({
    data: {
      applicationId: appStripe.id,
      type: 'INTERVIEW',
      remindAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
      isCompleted: false,
    },
  });


  // Application 3: Vercel (Watching)
  const appVercel = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      companyName: 'Vercel',
      roleTitle: 'Developer Advocate',
      jobType: JobType.CONTRACT,
      location: 'Remote',
      jobUrl: 'https://vercel.com/careers',
      sourcePlatform: SourcePlatform.REFERRAL,
      currentStage: StageType.WATCHING,
      appliedAt: null,
    },
  });

  await prisma.applicationStage.create({
    data: {
      applicationId: appVercel.id,
      stage: StageType.WATCHING,
      note: 'Saved because I saw a tweet from Guillermo Rauch',
    },
  });


  // Application 4: Upwork Contract (Rejected)
  const appUpwork = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      companyName: 'ACME Corp',
      roleTitle: 'Next.js Dashboard Consultant',
      jobType: JobType.FREELANCE,
      location: 'Remote',
      jobUrl: 'https://upwork.com',
      sourcePlatform: SourcePlatform.UPWORK,
      currentStage: StageType.REJECTED,
      appliedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    },
  });

  const tUpwork = appUpwork.appliedAt!.getTime();
  await prisma.applicationStage.createMany({
    data: [
      { applicationId: appUpwork.id, stage: StageType.APPLIED, enteredAt: new Date(tUpwork), leftAt: new Date(tUpwork + 3 * 24 * 60 * 60 * 1000), note: 'Submitted proposal' },
      { applicationId: appUpwork.id, stage: StageType.REJECTED, enteredAt: new Date(tUpwork + 3 * 24 * 60 * 60 * 1000), note: 'Proposal was declined. Client hired someone else.' },
    ],
  });

  console.log('Seeded job applications.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
