import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Session } from "next-auth"
import prisma from '@/lib/prisma';
import { buildStructuredPlaylist } from '@/lib/services/learning-path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } }
    const { query, language = 'en', difficulty = 'beginner' } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const playlist = await buildStructuredPlaylist(query, language, difficulty);

    if (!playlist) {
      return NextResponse.json({
        playlist: null,
        message: 'No videos found for this query. Please try a different search term.'
      });
    }

    if (session?.user?.id) {
      for (const video of playlist.videos) {
        try {
          await prisma.video.upsert({
            where: {
              youtubeId: video.id,
            },
            update: {
              title: video.title,
              description: video.description,
              thumbnail: video.thumbnailUrl,
              duration: video.duration,
            },
            create: {
              youtubeId: video.id,
              title: video.title,
              description: video.description,
              thumbnail: video.thumbnailUrl,
              duration: video.duration,
              userId: session.user.id,
            },
          });
        } catch (error) {
          console.error(`Error saving video ${video.id}:`, error);
        }
      }
    }

    return NextResponse.json({ 
      playlist,
      message: `Found ${playlist.totalVideos} videos for "${query}"`
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search videos. Please try again.' },
      { status: 500 }
    );
  }
}