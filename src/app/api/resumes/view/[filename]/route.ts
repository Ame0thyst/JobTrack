import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

type Params = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { filename } = await params;

    // Security check: ensure the filename is valid and belongs to the current user
    if (!filename.startsWith(userSession.userId)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);

    // Determine the Content-Type based on file extension
    let contentType = 'application/pdf';
    const lowerName = safeFilename.toLowerCase();
    if (lowerName.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (lowerName.endsWith('.doc')) {
      contentType = 'application/msword';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving resume file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
