import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request, { params }: { params: { mockId: string } }) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mockId = params.mockId;
    
    // Check if interview exists and belongs to user
    const interview = await prisma.mockInterview.findUnique({
      where: { mockId }
    });

    if (!interview) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (interview.createdBy !== session.user.email && interview.createdBy !== 'anonymous') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First delete associated UserAnswers (since they reference the mockId)
    await prisma.userAnswer.deleteMany({
      where: { mockIdRef: mockId }
    });

    // Then delete the interview
    await prisma.mockInterview.delete({
      where: { mockId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
