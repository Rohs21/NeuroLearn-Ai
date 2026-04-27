import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } };
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { youtubeId, score, total } = await req.json();
    if (!youtubeId || score == null || !total) {
      return NextResponse.json({ error: 'youtubeId, score, total required' }, { status: 400 });
    }

    const result = await (prisma as any).quizResult.create({
      data: { userId: session.user.id, youtubeId, score, total },
    });

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
