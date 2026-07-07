import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'JobTrack - Job Application Monitoring & Career Preparation System',
  description: 'Manage job applications, resume versions, career preparation, and analytics in a unified dashboard. Built with Next.js, PostgreSQL, and Prisma.',
  keywords: 'job tracker, application tracker, resume manager, career dashboard, kanban, job hunting',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full scroll-smooth", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
