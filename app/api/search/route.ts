import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { YouTubeService } from '@/lib/services/youtube';
import { GroqService } from '@/lib/services/groq';
import prisma from '@/lib/prisma';
import { Session } from "next-auth"
import { buildReferenceLinks } from '@/lib/roadmap/reference-links';

export const dynamic = 'force-dynamic';

function getCoveragePlan(query: string) {
  const lowerQuery = query.toLowerCase();

  if (/(react|reactjs|react\.js|next\.js|frontend|ui|javascript|typescript)/.test(lowerQuery)) {
    return {
      coverageInstructions: 'Cover React as a complete learning map. Explain the core mental model first, then the main APIs, then advanced patterns and ecosystem topics.',
      coverageTopics: [
        'React mental model and component architecture',
        'JSX, props, and component composition',
        'State management with useState',
        'Side effects and useEffect',
        'Callbacks, memoization, and useCallback/useMemo',
        'Refs and DOM access with useRef',
        'Context and global state',
        'State lifting and prop drilling',
        'Custom hooks and reusable logic',
        'Forms and controlled components',
        'Rendering lists, keys, and conditional UI',
        'Performance, re-rendering, and optimization',
        'Routing and data fetching patterns',
        'Testing and debugging React apps',
        'Common pitfalls and best practices',
      ],
    };
  }

  if (/(python|data science|machine learning|ai|deep learning|numpy|pandas)/.test(lowerQuery)) {
    return {
      coverageInstructions: 'Cover the subject end-to-end from fundamentals to practical workflows and advanced usage.',
      coverageTopics: [
        'Core language fundamentals',
        'Data structures and control flow',
        'Functions and modules',
        'File handling and environments',
        'Data analysis workflow',
        'Numerical computing',
        'Visualization',
        'Machine learning workflow',
        'Model evaluation and tuning',
        'Common pitfalls and best practices',
      ],
    };
  }

  return {
    coverageInstructions: 'Cover the canonical hot topics, prerequisites, common mistakes, and practical examples for this subject.',
    coverageTopics: [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } }
    const { query, language = 'en', difficulty = 'beginner', outputType = 'playlist' } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const youtubeService = new YouTubeService();
    const groqService = new GroqService();

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

    // Categorize all videos in a single batched LLM call
    const difficulties = await groqService.categorizeDifficultyBatch(
      uniqueVideos.map(v => ({ title: v.title, description: v.description }))
    );

    const categorizedVideos = uniqueVideos.map((video, index) => ({
      ...video,
      order: index + 1,
      difficulty: difficulties[index] ?? 'beginner',
      duration: youtubeService.formatDuration(video.duration),
    }));

    // Sort videos by difficulty (beginner -> intermediate -> advanced)
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const sortedVideos = categorizedVideos.sort((a, b) => {
      const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 1;
      const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 1;
      return aDiff - bDiff;
    });

    const references = buildReferenceLinks(query);
    const coveragePlan = getCoveragePlan(query);

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

    const roadmap = await groqService.generateLearningRoadmap({
      topic: query,
      language,
      difficulty,
      contextVideos: sortedVideos,
      references,
      coverageInstructions: coveragePlan.coverageInstructions,
      coverageTopics: coveragePlan.coverageTopics,
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

      // If the user generated a document/roadmap, record it as a Playlist entry
      // (prefixed "[Doc]") so the heatmap/streak API picks it up via Playlist.createdAt.
      if (outputType === 'document') {
        try {
          await (prisma as any).playlist.create({
            data: {
              title: `[Doc] ${query}`,
              description: `AI-generated learning document for ${query}`,
              videos: [],
              userId: session.user.id,
            },
          });
        } catch (error) {
          // Non-critical — don't fail the whole request if activity logging fails
          console.error('Failed to log document activity:', error);
        }
      }
    }

    return NextResponse.json({
      playlist: playlistData,
      document: roadmap,
      outputType,
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