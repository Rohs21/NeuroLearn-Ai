import prisma from '@/lib/prisma';
import { GroqService, LearningRoadmapStep } from '@/lib/services/groq';
import { YouTubeService } from '@/lib/services/youtube';

export type StructuredPlaylistVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  order: number;
  difficulty: string;
};

export type StructuredPlaylist = {
  title: string;
  description: string;
  query: string;
  language: string;
  difficulty: string;
  totalVideos: number;
  completedVideos: number;
  videos: StructuredPlaylistVideo[];
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function videoKey(video: { id?: string; title?: string; channelTitle?: string }): string {
  return normalizeText(`${video.title || ''} ${video.channelTitle || ''}`) || video.id || '';
}

function buildSearchQueries(topic: string, step: LearningRoadmapStep, language: string): string[] {
  const languageSuffix = language && language !== 'en' ? ` in ${language}` : '';
  return Array.from(new Set([
    step.searchQuery,
    `${topic} ${step.title}${languageSuffix}`,
    `${topic} ${step.focus}${languageSuffix}`,
  ].map(value => value.trim()).filter(Boolean)));
}

function scoreVideo(video: any, step: LearningRoadmapStep, stepIndex: number): number {
  const title = normalizeText(video.title || '');
  const stepTitle = normalizeText(step.title);
  const stepFocus = normalizeText(step.focus);
  const stepKeywords = step.keywords.map(normalizeText);

  let score = 0;

  if (title.includes(stepTitle)) score += 8;
  if (title.includes(stepFocus.slice(0, 32))) score += 5;
  if (title.includes('tutorial')) score += 2;
  if (title.includes('guide')) score += 2;
  if (title.includes('project')) score += 1;
  if (title.includes('course')) score += 1;

  for (const keyword of stepKeywords) {
    if (keyword && title.includes(keyword)) score += 2;
  }

  if (stepIndex > 0 && title.includes('intro')) score -= 4;
  if (stepIndex > 1 && title.includes('introduction')) score -= 4;
  if (stepIndex > 2 && title.includes('basics')) score -= 2;

  return score;
}

function uniqueVideos(videos: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];

  for (const video of videos) {
    const key = videoKey(video);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(video);
  }

  return result;
}

export async function buildStructuredPlaylist(
  query: string,
  language = 'en',
  difficulty = 'beginner'
): Promise<StructuredPlaylist | null> {
  const groqService = new GroqService();
  const youtubeService = new YouTubeService();

  const roadmap = await groqService.generateLearningRoadmap(query, language, difficulty);
  const selectedVideos: any[] = [];
  const usedKeys = new Set<string>();

  for (const [index, step] of roadmap.steps.entries()) {
    const stepQueries = buildSearchQueries(query, step, language);
    const candidates: any[] = [];

    for (const searchQuery of stepQueries.slice(0, 3)) {
      const results = await youtubeService.searchVideos(searchQuery, 8);
      candidates.push(...results);
    }

    const rankedCandidates = uniqueVideos(candidates)
      .filter(candidate => !usedKeys.has(videoKey(candidate)))
      .sort((a, b) => scoreVideo(b, step, index) - scoreVideo(a, step, index));

    const selected = rankedCandidates[0];
    if (selected) {
      usedKeys.add(videoKey(selected));
      selectedVideos.push(selected);
    }
  }

  if (selectedVideos.length < 3) {
    const fallbackQueries = [
      `${query} tutorial`,
      `${query} fundamentals`,
      `${query} complete course`,
    ];

    const fallbackCandidates: any[] = [];
    for (const fallbackQuery of fallbackQueries) {
      const results = await youtubeService.searchVideos(fallbackQuery, 10);
      fallbackCandidates.push(...results);
    }

    for (const candidate of uniqueVideos(fallbackCandidates)) {
      const key = videoKey(candidate);
      if (usedKeys.has(key)) {
        continue;
      }

      usedKeys.add(key);
      selectedVideos.push(candidate);

      if (selectedVideos.length >= roadmap.steps.length) {
        break;
      }
    }
  }

  const uniqueSelectedVideos = uniqueVideos(selectedVideos);
  if (uniqueSelectedVideos.length === 0) {
    return null;
  }

  const difficulties = await groqService.categorizeDifficultyBatch(
    uniqueSelectedVideos.map(video => ({
      title: video.title,
      description: video.description,
    }))
  );

  const orderedVideos: StructuredPlaylistVideo[] = uniqueSelectedVideos.map((video, index) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    channelTitle: video.channelTitle,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
    duration: youtubeService.formatDuration(video.duration),
    order: index + 1,
    difficulty: difficulties[index] ?? 'beginner',
  }));

  return {
    title: `${query} - Complete Learning Path`,
    description: `AI-curated learning playlist for ${query} with ${orderedVideos.length} videos`,
    query,
    language,
    difficulty,
    totalVideos: orderedVideos.length,
    completedVideos: 0,
    videos: orderedVideos,
  };
}

export async function saveStructuredPlaylistForUser(
  userId: string,
  playlist: StructuredPlaylist
) {
  const playlistCount = await prisma.playlist.count({
    where: { userId },
  });

  if (playlistCount >= 10) {
    const oldestPlaylist = await prisma.playlist.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (oldestPlaylist) {
      await prisma.playlist.delete({
        where: { id: oldestPlaylist.id },
      });
    }
  }

  return prisma.playlist.create({
    data: {
      title: playlist.title,
      description: playlist.description,
      videos: playlist,
      userId,
    },
  });
}