import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const playlist = await (prisma as any).playlist.findUnique({ where: { id: params.id } });
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } };
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { completedVideoId } = await req.json();
    if (!completedVideoId) return NextResponse.json({ error: 'completedVideoId required' }, { status: 400 });

    const playlist = await (prisma as any).playlist.findUnique({ where: { id: params.id } });
    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const videos = playlist.videos as any;
    const videoList: any[] = Array.isArray(videos?.videos) ? videos.videos : [];

    const updatedVideos = videoList.map((v: any) =>
      v.id === completedVideoId ? { ...v, isCompleted: true } : v
    );
    const completedCount = updatedVideos.filter((v: any) => v.isCompleted).length;

    const updated = await (prisma as any).playlist.update({
      where: { id: params.id },
      data: {
        videos: { ...videos, videos: updatedVideos, completedVideos: completedCount },
      },
    });

    return NextResponse.json({ playlist: updated, completedCount });
  } catch (error) {
    console.error('Playlist PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
