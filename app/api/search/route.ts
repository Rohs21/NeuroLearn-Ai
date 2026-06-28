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

    // ── Step 1: AI-decompose the topic into ordered curriculum modules ──
    // This replaces the old hardcoded suffix approach and gives YouTube
    // specific, meaningful queries per subtopic instead of "topic tutorial",
    // "topic complete course", etc.
    let curriculumTopics = await groqService.generateCurriculumTopics({
      topic: query,
      difficulty,
      language,
      maxTopics: 8,
    });

    console.log(`[Search] Curriculum topics for "${query}":`, curriculumTopics.map(t => t.searchQuery));

    // ── Step 2: Search YouTube once per curriculum topic ──────────────
    // Each topic gets its own targeted query → much higher chance of
    // finding the right video for that specific concept.
    const allVideos: any[] = [];
    const seenIds = new Set<string>();

    for (const topic of curriculumTopics) {
      const videos = await youtubeService.searchVideos(topic.searchQuery, 5);
      for (const video of videos) {
        if (!seenIds.has(video.id)) {
          seenIds.add(video.id);
          // Tag each video with its curriculum order so we can sort by it later
          allVideos.push({ ...video, _curriculumOrder: topic.order, _curriculumTopic: topic.topic });
        }
      }
    }

    // Fallback: if AI curriculum gave too few results, fill up with a broad search
    if (allVideos.length < 5) {
      console.warn('[Search] Curriculum search returned too few results, running broad fallback search.');
      const fallbackVideos = await youtubeService.searchVideos(`${query} tutorial`, 20);
      for (const video of fallbackVideos) {
        if (!seenIds.has(video.id)) {
          seenIds.add(video.id);
          allVideos.push({ ...video, _curriculumOrder: 99, _curriculumTopic: query });
        }
      }
    }

    const uniqueVideos = allVideos.slice(0, 25);

    if (uniqueVideos.length === 0) {
      return NextResponse.json({
        playlist: null,
        message: 'No videos found for this query. Please try a different search term.'
      });
    }

    // ── Step 3: Categorize difficulty in a single batched LLM call ────
    const difficulties = await groqService.categorizeDifficultyBatch(
      uniqueVideos.map(v => ({ title: v.title, description: v.description }))
    );

    const categorizedVideos = uniqueVideos.map((video, index) => ({
      ...video,
      order: index + 1,
      difficulty: difficulties[index] ?? 'beginner',
      duration: youtubeService.formatDuration(video.duration),
    }));

    // ── Step 4: Sort by curriculum order first, then difficulty within each topic ──
    // This keeps the structured sequence the AI designed while still
    // ordering beginner→intermediate within the same topic slot.
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const sortedVideos = categorizedVideos.sort((a, b) => {
      const aOrder = a._curriculumOrder ?? 99;
      const bOrder = b._curriculumOrder ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 1;
      const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 1;
      return aDiff - bDiff;
    });

    // Re-assign sequential order numbers after sorting
    sortedVideos.forEach((v, i) => { v.order = i + 1; });

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