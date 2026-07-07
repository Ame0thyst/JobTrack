import { PrismaClient, JobType, StageType, SourcePlatform } from '@prisma/client';

const prisma = new PrismaClient();

const companies = [
  { name: 'Microsoft', industry: 'Software', website: 'https://microsoft.com', logo: 'https://img.icons8.com/color/120/microsoft.png' },
  { name: 'Amazon', industry: 'E-commerce', website: 'https://amazon.com', logo: 'https://img.icons8.com/color/120/amazon.png' },
  { name: 'Meta', industry: 'Social Media', website: 'https://meta.com', logo: 'https://img.icons8.com/color/120/meta.png' },
  { name: 'Apple', industry: 'Consumer Electronics', website: 'https://apple.com', logo: 'https://img.icons8.com/color/120/apple-logo.png' },
  { name: 'Netflix', industry: 'Entertainment', website: 'https://netflix.com', logo: 'https://img.icons8.com/color/120/netflix.png' },
  { name: 'Airbnb', industry: 'Hospitality', website: 'https://airbnb.com', logo: 'https://img.icons8.com/color/120/airbnb.png' },
  { name: 'Uber', industry: 'Transportation', website: 'https://uber.com', logo: 'https://img.icons8.com/color/120/uber.png' },
  { name: 'Slack', industry: 'Communication', website: 'https://slack.com', logo: 'https://img.icons8.com/color/120/slack-new.png' },
  { name: 'Figma', industry: 'Design Tool', website: 'https://figma.com', logo: 'https://img.icons8.com/color/120/figma.png' },
  { name: 'GitHub', industry: 'Software Development', website: 'https://github.com', logo: 'https://img.icons8.com/color/120/github--v1.png' },
  { name: 'Notion', industry: 'Productivity', website: 'https://notion.so' },
  { name: 'Supabase', industry: 'Database', website: 'https://supabase.com' },
  { name: 'OpenAI', industry: 'Artificial Intelligence', website: 'https://openai.com' },
  { name: 'Anthropic', industry: 'Artificial Intelligence', website: 'https://anthropic.com' },
  { name: 'Canva', industry: 'Design', website: 'https://canva.com' },
  { name: 'Spotify', industry: 'Entertainment', website: 'https://spotify.com' },
  { name: 'TikTok', industry: 'Social Media', website: 'https://tiktok.com' },
  { name: 'Shopify', industry: 'E-commerce', website: 'https://shopify.com' },
  { name: 'Datadog', industry: 'Monitoring', website: 'https://datadoghq.com' },
  { name: 'Sentry', industry: 'Monitoring', website: 'https://sentry.io' },
  { name: 'Postman', industry: 'API Client', website: 'https://postman.com' },
  { name: 'Webflow', industry: 'No-code', website: 'https://webflow.com' },
  { name: 'Framer', industry: 'No-code', website: 'https://framer.com' },
  { name: 'Zoom', industry: 'Communication', website: 'https://zoom.us' },
  { name: 'Dropbox', industry: 'Cloud Storage', website: 'https://dropbox.com' },
  { name: 'Salesforce', industry: 'CRM', website: 'https://salesforce.com' },
  { name: 'Atlassian', industry: 'Collaboration', website: 'https://atlassian.com' },
  { name: 'HubSpot', industry: 'Marketing', website: 'https://hubspot.com' },
  { name: 'Vercel', industry: 'Cloud Hosting', website: 'https://vercel.com' },
  { name: 'Stripe', industry: 'Fintech', website: 'https://stripe.com' },
  { name: 'Clerk', industry: 'Auth Service', website: 'https://clerk.com' },
  { name: 'Auth0', industry: 'Auth Service', website: 'https://auth0.com' },
  { name: 'Linear', industry: 'Productivity', website: 'https://linear.app' },
  { name: 'Retool', industry: 'Internal Tools', website: 'https://retool.com' },
  { name: 'Railway', industry: 'Cloud Hosting', website: 'https://railway.app' },
  { name: 'Render', industry: 'Cloud Hosting', website: 'https://render.com' },
  { name: 'Fly.io', industry: 'Cloud Hosting', website: 'https://fly.io' },
  { name: 'Neon', industry: 'Database', website: 'https://neon.tech' },
  { name: 'MongoDB', industry: 'Database', website: 'https://mongodb.com' },
  { name: 'Redis', industry: 'Database', website: 'https://redis.io' },
  { name: 'Algolia', industry: 'Search API', website: 'https://algolia.com' },
  { name: 'Twilio', industry: 'Communication', website: 'https://twilio.com' },
  { name: 'SendGrid', industry: 'Email Service', website: 'https://sendgrid.com' },
  { name: 'Mailchimp', industry: 'Marketing', website: 'https://mailchimp.com' },
  { name: 'Pinterest', industry: 'Social Media', website: 'https://pinterest.com' },
  { name: 'Reddit', industry: 'Social Media', website: 'https://reddit.com' },
  { name: 'Discord', industry: 'Communication', website: 'https://discord.com' },
  { name: 'Asana', industry: 'Collaboration', website: 'https://asana.com' },
  { name: 'Trello', industry: 'Collaboration', website: 'https://trello.com' },
  { name: 'Wix', industry: 'Website Builder', website: 'https://wix.com' }
];

const roles = [
  'Frontend Engineer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer II',
  'Senior Frontend Developer',
  'Senior Software Engineer',
  'React Next.js Engineer',
  'DevOps Engineer',
  'Mobile Developer (iOS/Android)',
  'QA Automation Engineer',
  'Site Reliability Engineer',
  'Solutions Architect'
];

const jobTypes = [
  JobType.FULL_TIME,
  JobType.FULL_TIME,
  JobType.FULL_TIME, // More full time weight
  JobType.CONTRACT,
  JobType.FREELANCE,
  JobType.INTERNSHIP
];

const platforms = [
  SourcePlatform.LINKEDIN,
  SourcePlatform.INDEED,
  SourcePlatform.COMPANY_WEBSITE,
  SourcePlatform.REFERRAL,
  SourcePlatform.OTHER,
  SourcePlatform.LINKEDIN
];

const stages = [
  StageType.WATCHING,
  StageType.PREPARED,
  StageType.APPLIED,
  StageType.HR_SCREENING,
  StageType.INTERVIEW_1,
  StageType.INTERVIEW_2,
  StageType.REVIEW,
  StageType.OFFER,
  StageType.REJECTED
];

const contactsData = [
  { name: 'Sarah Jenkins', role: 'Technical Recruiter', email: 'sarah.jenkins@hr.com', phone: '+1-555-0199', notes: 'Very friendly, likes candidate portfolio.' },
  { name: 'Alex Rivera', role: 'Engineering Manager', email: 'alex.rivera@tech.com', notes: 'Asked deep questions about system design and state management.' },
  { name: 'John Doe', role: 'Senior Developer', notes: 'Did the coding interview session.' },
  { name: 'Emily Watson', role: 'Talent Acquisition Partner', email: 'emily.w@hr-talent.com', phone: '+62812345678' }
];

const currencies = ['IDR', 'USD', 'SGD', 'EUR'];

async function main() {
  console.log('Fetching users...');
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.error('No users found in database! Please register an account first in the web UI.');
    return;
  }

  console.log(`Seeding 50 applications for each of the ${users.length} user(s) in the database...`);

  for (const user of users) {
    // Check existing applications to avoid bloating indefinitely if re-run
    const count = await prisma.jobApplication.count({ where: { userId: user.id } });
    if (count > 20) {
      console.log(`User ${user.email} already has ${count} applications. Cleaning up old seeded data for this user first...`);
      await prisma.reminder.deleteMany({ where: { application: { userId: user.id } } });
      await prisma.applicationNote.deleteMany({ where: { application: { userId: user.id } } });
      await prisma.applicationStage.deleteMany({ where: { application: { userId: user.id } } });
      await prisma.contact.deleteMany({ where: { application: { userId: user.id } } });
      await prisma.jobApplication.deleteMany({ where: { userId: user.id } });
    }

    // Prepare streak dates (Ensure active streak of 7 days including today)
    const streakDates: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      // Give it some variations in hours
      d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      streakDates.push(d);
    }

    // Seed 50 applications
    for (let i = 0; i < 50; i++) {
      const company = companies[i % companies.length];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const currency = currencies[Math.floor(Math.random() * currencies.length)];

      // Salary settings
      let salaryMin = null;
      let salaryMax = null;
      let benefits = null;

      // Assign salaries to some applications (particularly offers and interviews)
      const hasSalary = Math.random() > 0.4 || i % 5 === 0;
      if (hasSalary) {
        if (currency === 'IDR') {
          salaryMin = 15000000 + Math.floor(Math.random() * 15) * 1000000;
          salaryMax = salaryMin + 5000000 + Math.floor(Math.random() * 10) * 1000000;
          benefits = 'BPJS, laptop allowance, WFH stipend, quarterly performance bonus';
        } else {
          salaryMin = 5000 + Math.floor(Math.random() * 8) * 1000; // Monthly USD/EUR
          salaryMax = salaryMin + 2000 + Math.floor(Math.random() * 5) * 1000;
          benefits = 'Full health cover, stock options, learning budget, yearly company retreat';
        }
      }

      // Stage weights: more applied/rejected than offer
      let stage: StageType = StageType.APPLIED;
      if (i < 5) stage = StageType.OFFER;
      else if (i < 15) stage = StageType.REJECTED;
      else if (i < 22) stage = StageType.INTERVIEW_1;
      else if (i < 26) stage = StageType.INTERVIEW_2;
      else if (i < 30) stage = StageType.HR_SCREENING;
      else if (i < 35) stage = StageType.REVIEW;
      else if (i < 40) stage = StageType.WATCHING;
      else if (i < 45) stage = StageType.PREPARED;

      // Date alignment
      let appliedAt = null;
      let createdAt = new Date();

      if (i < 7) {
        // Guarantee these are set on consecutive days to form the streak widget!
        appliedAt = streakDates[i];
        createdAt = streakDates[i];
      } else {
        // Random days in the last 40 days
        const daysAgo = 1 + Math.floor(Math.random() * 40);
        const date = new Date();
        date.setDate(now.getDate() - daysAgo);
        date.setHours(8 + Math.floor(Math.random() * 12));
        
        createdAt = date;
        if (stage !== StageType.WATCHING && stage !== StageType.PREPARED) {
          appliedAt = date;
        }
      }

      const jobApp = await prisma.jobApplication.create({
        data: {
          userId: user.id,
          companyName: company.name,
          companyLogo: company.logo || null,
          companyWebsite: company.website || null,
          companyIndustry: company.industry || null,
          roleTitle: role,
          jobType,
          location: Math.random() > 0.3 ? 'Remote' : 'Jakarta, Indonesia',
          jobUrl: company.website ? `${company.website}/careers` : 'https://linkedin.com/jobs',
          sourcePlatform: platform,
          currentStage: stage,
          appliedAt,
          createdAt,
          updatedAt: createdAt,
          // Salary Track fields
          salaryMin,
          salaryMax,
          salaryCurrency: currency,
          benefits,
        }
      });

      // Create stages log
      const tApplied = appliedAt ? appliedAt.getTime() : createdAt.getTime();
      const stageLogs = [];

      if (stage === StageType.WATCHING) {
        stageLogs.push({ stage: StageType.WATCHING, enteredAt: createdAt, note: 'Found job post on ' + platform });
      } else if (stage === StageType.PREPARED) {
        stageLogs.push({ stage: StageType.WATCHING, enteredAt: new Date(tApplied - 2 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied - 1 * 24 * 60 * 60 * 1000), note: 'Interested' });
        stageLogs.push({ stage: StageType.PREPARED, enteredAt: new Date(tApplied - 1 * 24 * 60 * 60 * 1000), note: 'Resume is customized' });
      } else {
        // Build progressive history
        stageLogs.push({ stage: StageType.WATCHING, enteredAt: new Date(tApplied - 3 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied - 1 * 24 * 60 * 60 * 1000), note: 'Discovered job opening' });
        stageLogs.push({ stage: StageType.PREPARED, enteredAt: new Date(tApplied - 1 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied), note: 'Applied details prepared' });
        
        if (stage === StageType.APPLIED) {
          stageLogs.push({ stage: StageType.APPLIED, enteredAt: new Date(tApplied), note: 'Submitted via ' + platform });
        } else if (stage === StageType.REJECTED) {
          stageLogs.push({ stage: StageType.APPLIED, enteredAt: new Date(tApplied), leftAt: new Date(tApplied + 5 * 24 * 60 * 60 * 1000), note: 'Submitted application' });
          stageLogs.push({ stage: StageType.REJECTED, enteredAt: new Date(tApplied + 5 * 24 * 60 * 60 * 1000), note: 'Received auto-rejection email. Tough market.' });
        } else if (stage === StageType.HR_SCREENING) {
          stageLogs.push({ stage: StageType.APPLIED, enteredAt: new Date(tApplied), leftAt: new Date(tApplied + 4 * 24 * 60 * 60 * 1000), note: 'Submitted application' });
          stageLogs.push({ stage: StageType.HR_SCREENING, enteredAt: new Date(tApplied + 4 * 24 * 60 * 60 * 1000), note: 'Contacted by recruiter' });
        } else if (stage === StageType.INTERVIEW_1 || stage === StageType.INTERVIEW_2 || stage === StageType.REVIEW) {
          stageLogs.push({ stage: StageType.APPLIED, enteredAt: new Date(tApplied), leftAt: new Date(tApplied + 3 * 24 * 60 * 60 * 1000), note: 'Submitted' });
          stageLogs.push({ stage: StageType.HR_SCREENING, enteredAt: new Date(tApplied + 3 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied + 7 * 24 * 60 * 60 * 1000), note: 'Screening done' });
          stageLogs.push({ stage: StageType.INTERVIEW_1, enteredAt: new Date(tApplied + 7 * 24 * 60 * 60 * 1000), note: 'Technical Round 1' });
          
          if (stage === StageType.INTERVIEW_2) {
            stageLogs.push({ stage: StageType.INTERVIEW_2, enteredAt: new Date(tApplied + 12 * 24 * 60 * 60 * 1000), note: 'System Design round' });
          } else if (stage === StageType.REVIEW) {
            stageLogs.push({ stage: StageType.INTERVIEW_2, enteredAt: new Date(tApplied + 12 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied + 17 * 24 * 60 * 60 * 1000) });
            stageLogs.push({ stage: StageType.REVIEW, enteredAt: new Date(tApplied + 17 * 24 * 60 * 60 * 1000), note: 'Awaiting reference checks and decision' });
          }
        } else if (stage === StageType.OFFER) {
          stageLogs.push({ stage: StageType.APPLIED, enteredAt: new Date(tApplied), leftAt: new Date(tApplied + 4 * 24 * 60 * 60 * 1000), note: 'Submitted' });
          stageLogs.push({ stage: StageType.HR_SCREENING, enteredAt: new Date(tApplied + 4 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied + 10 * 24 * 60 * 60 * 1000) });
          stageLogs.push({ stage: StageType.INTERVIEW_1, enteredAt: new Date(tApplied + 10 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied + 17 * 24 * 60 * 60 * 1000) });
          stageLogs.push({ stage: StageType.INTERVIEW_2, enteredAt: new Date(tApplied + 17 * 24 * 60 * 60 * 1000), leftAt: new Date(tApplied + 24 * 24 * 60 * 60 * 1000) });
          stageLogs.push({ stage: StageType.OFFER, enteredAt: new Date(tApplied + 24 * 24 * 60 * 60 * 1000), note: 'Offer received! base salary + equity package' });
        }
      }

      await prisma.applicationStage.createMany({
        data: stageLogs.map(log => ({
          applicationId: jobApp.id,
          stage: log.stage,
          enteredAt: log.enteredAt,
          leftAt: log.leftAt || null,
          note: log.note || null
        }))
      });

      // Add contacts to some applications
      if (i % 3 === 0) {
        const contactInfo = contactsData[i % contactsData.length];
        await prisma.contact.create({
          data: {
            applicationId: jobApp.id,
            name: contactInfo.name,
            role: contactInfo.role || null,
            email: contactInfo.email || null,
            phone: contactInfo.phone || null,
            notes: contactInfo.notes || null
          }
        });
      }

      // Add some notes (GENERAL and INTERVIEW_PREP)
      if (i % 2 === 0) {
        await prisma.applicationNote.createMany({
          data: [
            {
              applicationId: jobApp.id,
              type: 'GENERAL',
              content: `Key company products and focus:\n- Cloud infrastructure optimization.\n- Fast paced agile team structure.\n- Tech stack: React, TypeScript, AWS.`,
              createdAt: new Date(tApplied)
            },
            {
              applicationId: jobApp.id,
              type: 'INTERVIEW_PREP',
              title: 'Technical Round Preparation',
              content: `Topics to revise:\n1. Event loop and microtasks in Node.js.\n2. SQL Indexes and query optimization in MySQL.\n3. Custom React hooks and caching strategies.`,
              createdAt: new Date(tApplied)
            }
          ]
        });
      }

      // Add some reminders (past, today, and future to fill out notification system and calendar)
      if (i % 4 === 0) {
        // 50% completed, 50% active
        const isCompleted = Math.random() > 0.5;
        
        let remindAt = new Date();
        if (i % 8 === 0) {
          // Future reminder (shows in calendar & notif)
          remindAt.setDate(now.getDate() + (1 + Math.floor(Math.random() * 10)));
        } else {
          // Past reminder
          remindAt.setDate(now.getDate() - (1 + Math.floor(Math.random() * 5)));
        }

        const remTypes = ['FOLLOW_UP', 'INTERVIEW', 'DEADLINE'];
        const remType = remTypes[i % remTypes.length];

        await prisma.reminder.create({
          data: {
            applicationId: jobApp.id,
            type: remType as any,
            remindAt,
            isCompleted
          }
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
