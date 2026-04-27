import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const playlist = await (prisma as any).playlist.findUnique({ where: { id: params.id } });
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    let parsedVideos = playlist.videos;
    if (typeof parsedVideos === 'string') {
      try { parsedVideos = JSON.parse(parsedVideos); } catch(e) {}
    }
    return NextResponse.json({ ...playlist, videos: parsedVideos });
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

    let videos = playlist.videos as any;
    if (typeof videos === 'string') {
      try { videos = JSON.parse(videos); } catch(e) {}
    }
    const videoList: any[] = Array.isArray(videos) ? videos : Array.isArray(videos?.videos) ? videos.videos : [];

    const updatedVideos = videoList.map((v: any) =>
      v.id === completedVideoId ? { ...v, isCompleted: true } : v
    );
    const completedCount = updatedVideos.filter((v: any) => v.isCompleted).length;

    const updated = await (prisma as any).playlist.update({
      where: { id: params.id },
      data: {
        videos: updatedVideos,
      },
    });

    return NextResponse.json({ playlist: updated, completedCount });
  } catch (error) {
    console.error('Playlist PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } };
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const playlist = await (prisma as any).playlist.findUnique({ where: { id: params.id } });
    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await (prisma as any).playlist.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Playlist DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
