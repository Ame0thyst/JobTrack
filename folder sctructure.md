jobtrack/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── icons/
│   ├── images/
│
├── src/
│
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── applications/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── components/
│   │   │   │
│   │   │   ├── kanban/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── resumes/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── applications/
│   │   │   ├── resumes/
│   │   │   ├── reminders/
│   │   │   └── analytics/
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── input.tsx
│   │   │   └── table.tsx
│   │   │
│   │   ├── dashboard/
│   │   ├── kanban/
│   │   ├── applications/
│   │   └── analytics/
│
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│
│   ├── services/
│   │   ├── application.service.ts
│   │   ├── resume.service.ts
│   │   ├── reminder.service.ts
│   │   └── analytics.service.ts
│
│   ├── store/
│   │   ├── application.store.ts
│   │   ├── ui.store.ts
│   │   └── auth.store.ts
│
│   ├── hooks/
│   │   ├── useApplications.ts
│   │   ├── useKanban.ts
│   │   └── useAnalytics.ts
│
│   ├── types/
│   │   ├── application.types.ts
│   │   ├── resume.types.ts
│   │   └── analytics.types.ts
│
│   └── styles/
│       └── globals.css
│
├── .env
├── next.config.js
├── package.json
└── README.md