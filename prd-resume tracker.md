# PRD - Job Application Monitoring & Career Preparation System

## 1. Product Overview

### 1.1 Product Name
JobTrack System (Working Name)

### 1.2 Product Description
JobTrack System is a web-based application built with Next.js and PostgreSQL to manage job applications, resume versions, career preparation, and application analytics in a unified workflow system. The platform combines CRM-style tracking with Kanban visualization to support structured job search management.

### 1.3 Problem Statement
Job seekers lack structured systems to manage applications, leading to:
- Lost application tracking
- Missed follow-ups
- Poor interview preparation management
- No visibility of application performance
- Fragmented resume versions across platforms

### 1.4 Product Objective
The system provides:
- Centralized job application tracking
- Preparation workflow before application
- Structured pipeline monitoring
- Reminder automation
- Data-driven career analytics

---

## 2. Target Users

### 2.1 Primary Users
- University students
- Internship applicants
- Full-time job seekers
- Freelancers

### 2.2 Secondary Users
- Career advisors
- Mentors
- Recruitment consultants

---

## 3. Scope of Product

The system supports:
- Internship applications
- Full-time jobs
- Freelance jobs
- Contract-based work
- Custom opportunity types

---

## 4. Core Workflow Design

## 4.1 Preparation Phase (Pre-Application)
This phase ensures readiness before applying.

Stages:
- Watching (job saved but not applied)
- Prepared (resume ready + analysis done)
- Ready to Apply (final check completed)

Key elements:
- Resume selection per job
- Cover letter preparation
- Skill match checklist
- Company research notes

---

## 4.2 Application Pipeline (Main System)

Stages:
- Watching
- Applied
- HR Screening
- Interview 1
- Interview 2
- Review
- Offer
- Rejected (final state)

Rules:
- Each company can override stages
- Each stage has timestamp tracking
- Stage movement is logged

---

## 5. Data Structure Design

## 5.1 Job Application Entity

Fields:
- id
- company_name
- role_title
- job_type (internship, full-time, freelance)
- location
- job_url
- source_platform
- current_stage
- created_at
- updated_at

---

## 5.2 Tracking Data

- applied_date
- stage_history (array of timestamps)
- rejection_reason (optional)
- offer_details (optional)

---

## 5.3 Preparation Data

- resume_version_id
- cover_letter_version_id
- skill_match_notes
- research_notes

---

## 5.4 Communication Data

- recruiter_name
- recruiter_email
- follow_up_logs

---

## 6. Reminder System

## 6.1 Types of Reminder

- Follow-up reminder (3, 7, 14 days after application)
- Interview reminder (calendar-based)
- Deadline reminder
- Inactivity alert (no stage change)

## 6.2 Trigger Logic

- Time-based scheduler
- Event-based triggers (stage change)
- User-defined rules

---

## 7. Analytics System

## 7.1 Success Rate

Formula:
success_rate = offers / total_applications

Based on:
- Final stage status

---

## 7.2 Response Time Analysis

Formula:
response_time = first_stage_change_date - applied_date

If no response:
- Mark as "No Response"

---

## 7.3 Channel Performance

Tracked by:
- source_platform

Metrics:
- conversion rate per platform
- response rate per platform

---

## 7.4 Application Timing Analysis

Tracked fields:
- applied_at timestamp

Insights:
- best day of week
- best hour of submission
- correlation with response rate

---

## 8. UI/UX Design System

## 8.1 Dashboard (CRM Style)
- Table view
- Filters by stage, company, type
- Quick actions

## 8.2 Kanban Board
- Drag and drop pipeline
- Stage-based columns
- Visual progression tracking

## 8.3 Detail Panel
- Resume version
- Notes
- Timeline history
- Communication logs

---

## 9. System Architecture

## 9.1 Frontend
- Next.js (App Router)
- TailwindCSS
- Zustand for state management

## 9.2 Backend
- Next.js API Routes or Node.js service layer

## 9.3 Database
- PostgreSQL (primary cloud database)
- Prisma ORM

## 9.4 Local Storage
- IndexedDB for offline-first support

## 9.5 Sync Strategy
- Local-first write
- Background sync to cloud
- Conflict resolution based on latest timestamp

---

## 10. Authentication System

Supported methods:
- Google OAuth
- Email + Password
- Custom ID login system

---

## 11. Integration System

## 11.1 Phase 1
- Google Calendar integration (interviews + reminders)

## 11.2 Phase 2
- LinkedIn (manual import first, API later)
- Upwork integration

## 11.3 Phase 3
- Notion export/import
- Excel / CSV full sync

Note:
LinkedIn and Upwork APIs have restrictions, so automation is limited in early version.

---

## 12. Import & Export System

## 12.1 Import
- CSV (Excel compatible)
- JSON backup
- Notion import

## 12.2 Export
- CSV export
- JSON full backup
- PDF report (career summary)

---

## 13. Notification System

Channels:
- In-app notifications
- Email notifications
- Calendar events (Google Calendar)

Triggers:
- Application follow-up
- Interview schedule
- Deadline alerts
- Stage inactivity

---

## 14. Priority Features

## P0 (MVP)
- Job application tracking system
- CRM + Kanban hybrid UI
- Authentication system
- PostgreSQL + Prisma setup
- Basic analytics (success rate, response time)
- Manual job entry system

## P1
- Reminder system
- Resume version tracking
- Google Calendar integration
- CSV import/export

## P2
- Channel analytics (LinkedIn, Upwork)
- Application timing analytics
- Notion integration

## P3
- Advanced automation system
- AI assistance features (future expansion)

---

## 15. Product Principle

The system is designed as a decision-support platform, not only a tracker.

It enables:
- Structured job search execution
- Performance measurement of job applications
- Optimization of application timing and channels
- Controlled preparation workflow

---

## 16. Future Expansion

- Browser extension for auto job capture
- AI resume optimization engine
- Job recommendation engine
- Company database enrichment system