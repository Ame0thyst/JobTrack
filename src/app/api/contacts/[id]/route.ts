import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// PUT: Update a contact
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, email, phone, linkedinUrl, notes } = body;

    // Verify contact exists and belongs to user
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!contact || contact.application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name: name !== undefined ? name : contact.name,
        role: role !== undefined ? role : contact.role,
        email: email !== undefined ? email : contact.email,
        phone: phone !== undefined ? phone : contact.phone,
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : contact.linkedinUrl,
        notes: notes !== undefined ? notes : contact.notes,
      },
    });

    return NextResponse.json({ contact: updatedContact }, { status: 200 });
  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a contact
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify contact exists and belongs to user
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!contact || contact.application.userId !== userSession.userId) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Contact deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
