import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: userSession.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ resumes }, { status: 200 });
  } catch (error) {
    console.error('Fetch resumes error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { title, fileUrl, content, version = 1 } = await request.json();

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: userSession.userId,
        title,
        fileUrl,
        content,
        version: Number(version),
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error('Create resume error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
