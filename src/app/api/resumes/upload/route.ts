import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Only allow PDFs and documents
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only PDF and Word documents are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = path.extname(file.name) || '.pdf';
    const filename = `${userSession.userId}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/api/resumes/view/${filename}`;

    return NextResponse.json({ fileUrl }, { status: 200 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 });
  }
}
