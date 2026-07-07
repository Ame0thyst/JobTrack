generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum JobType {
  INTERNSHIP
  FULL_TIME
  FREELANCE
  CONTRACT
  OTHER
}

enum StageType {
  WATCHING
  PREPARED
  APPLIED
  HR_SCREENING
  INTERVIEW_1
  INTERVIEW_2
  REVIEW
  OFFER
  REJECTED
}

enum SourcePlatform {
  LINKEDIN
  INDEED
  UPWORK
  REFERRAL
  COMPANY_WEBSITE
  OTHER
}

model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  password      String?
  provider      String? // google, email
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  applications  JobApplication[]
  resumes       Resume[]
}

model JobApplication {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  companyName     String
  companyLogo     String?       @db.LongText
  companyWebsite    String?       @db.Text
  companyIndustry   String?       @db.VarChar(191)
  companyDescription String?       @db.Text
  companyFounded     String?       @db.VarChar(50)
  roleTitle       String
  jobType         JobType
  location        String?
  jobUrl          String?       @db.Text

  sourcePlatform  SourcePlatform

  currentStage    StageType     @default(WATCHING)

  appliedAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  stages          ApplicationStage[]
  notes           ApplicationNote[]
  reminders       Reminder[]
  resumeId        String?
  resume          Resume?       @relation(fields: [resumeId], references: [id])
}

model ApplicationStage {
  id              String        @id @default(cuid())
  applicationId   String
  application     JobApplication @relation(fields: [applicationId], references: [id])

  stage           StageType
  enteredAt       DateTime      @default(now())
  leftAt          DateTime?
  note            String?       @db.Text
}

model ApplicationNote {
  id              String        @id @default(cuid())
  applicationId   String
  application     JobApplication @relation(fields: [applicationId], references: [id])

  content         String        @db.Text
  createdAt       DateTime      @default(now())
}

model Resume {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  title           String
  fileUrl         String?
  content         String?       @db.Text // optional parsed resume text

  version         Int           @default(1)
  createdAt       DateTime      @default(now())

  applications    JobApplication[]
}

model Reminder {
  id              String        @id @default(cuid())
  applicationId   String
  application     JobApplication @relation(fields: [applicationId], references: [id])

  type            String // FOLLOW_UP, INTERVIEW, DEADLINE
  remindAt        DateTime
  isCompleted     Boolean       @default(false)
  createdAt       DateTime      @default(now())
}

model AnalyticsSnapshot {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  totalApplied    Int
  totalOffers     Int
  totalRejected   Int

  successRate     Float
  avgResponseTime Float?

  createdAt       DateTime      @default(now())
}