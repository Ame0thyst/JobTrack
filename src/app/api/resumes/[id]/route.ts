import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content, version, fileUrl } = await request.json();

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume || resume.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Resume profile not found' }, { status: 404 });
    }

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        title: title !== undefined ? title : resume.title,
        content: content !== undefined ? content : resume.content,
        version: version !== undefined ? Number(version) : resume.version,
        fileUrl: fileUrl !== undefined ? fileUrl : resume.fileUrl,
      },
    });

    return NextResponse.json({ resume: updated }, { status: 200 });
  } catch (error) {
    console.error('Update resume error:', error);
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

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume || resume.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Resume profile not found' }, { status: 404 });
    }

    // 1. Unlink from any job applications (set resumeId to null)
    await prisma.jobApplication.updateMany({
      where: { resumeId: id },
      data: { resumeId: null },
    });

    // 2. Delete physical file if it exists in uploads folder
    if (resume.fileUrl) {
      try {
        let filename = '';
        if (resume.fileUrl.startsWith('/api/resumes/view/')) {
          filename = resume.fileUrl.replace('/api/resumes/view/', '');
        } else if (resume.fileUrl.startsWith('/uploads/')) {
          filename = resume.fileUrl.replace('/uploads/', '');
        }

        if (filename) {
          const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (err) {
        console.error('Failed to delete physical resume file:', err);
      }
    }

    // 3. Delete record from database
    await prisma.resume.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Resume deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
