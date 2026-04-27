import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } };
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const youtubeId = req.nextUrl.searchParams.get('videoId');
    if (!youtubeId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const note = await (prisma as any).note.findUnique({
      where: { userId_youtubeId: { userId: session.user.id, youtubeId } },
    });

    return NextResponse.json({ content: note?.content ?? '' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } };
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { youtubeId, content } = await req.json();
    if (!youtubeId) return NextResponse.json({ error: 'youtubeId required' }, { status: 400 });

    const note = await (prisma as any).note.upsert({
      where: { userId_youtubeId: { userId: session.user.id, youtubeId } },
      update: { content },
      create: { userId: session.user.id, youtubeId, content },
    });

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
