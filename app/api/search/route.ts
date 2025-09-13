import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { YouTubeService } from '@/lib/services/youtube';
import { GeminiService } from '@/lib/services/gemini';
import { PrismaClient } from '@prisma/client';
import { Session } from "next-auth"

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } }
    const { query, language = 'en', difficulty = 'beginner' } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const youtubeService = new YouTubeService();
    const geminiService = new GeminiService();

    // Generate smart queries for better results
    const smartQueries = await youtubeService.generateSmartQuery(query, language);
    
    // Search videos from multiple queries and combine results
    const allVideos = [];
    for (const smartQuery of smartQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
      const videos = await youtubeService.searchVideos(smartQuery, 15);
      allVideos.push(...videos);
    }

    // Remove duplicates and limit results
    const uniqueVideos = allVideos
      .filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      )
      .slice(0, 25);

    if (uniqueVideos.length === 0) {
      return NextResponse.json({ 
        playlist: null, 
        message: 'No videos found for this query. Please try a different search term.' 
      });
    }

    // Categorize videos by difficulty using AI
    const categorizedVideos = await Promise.all(
      uniqueVideos.map(async (video, index) => {
        const aiDifficulty = await geminiService.categorizeDifficulty(
          video.title, 
          video.description
        );
        
        return {
          ...video,
          order: index + 1,
          difficulty: aiDifficulty,
          duration: youtubeService.formatDuration(video.duration),
        };
      })
    );

    // Sort videos by difficulty (beginner -> intermediate -> advanced)
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const sortedVideos = categorizedVideos.sort((a, b) => {
      const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 1;
      const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 1;
      return aDiff - bDiff;
    });

    // Save videos to database if user is authenticated
    if (session?.user?.id) {
      const videoPromises = sortedVideos.map(async (video) => {
        try {
          return await prisma.video.upsert({
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
          return null;
        }
      });

      await Promise.allSettled(videoPromises);
    }

    // Create playlist
    const playlistData = {
      title: `${query} - Complete Learning Path`,
      description: `AI-curated learning playlist for ${query} with ${sortedVideos.length} videos`,
      query,
      language,
      difficulty,
      totalVideos: sortedVideos.length,
      completedVideos: 0,
      videos: sortedVideos,
    };

    return NextResponse.json({ 
      playlist: playlistData,
      message: `Found ${sortedVideos.length} videos for "${query}"`
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search videos. Please try again.' },
      { status: 500 }
    );
  }
}