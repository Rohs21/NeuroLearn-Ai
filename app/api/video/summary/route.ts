import { NextRequest, NextResponse } from 'next/server';
import { GroqService } from '@/lib/services/groq';
import { YouTubeService } from '@/lib/services/youtube';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { title, description, videoId } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const groqService = new GroqService();
    const youtubeService = new YouTubeService();

    const transcript = videoId ? await youtubeService.getTranscript(videoId) : '';

    // Single LLM call — summary + quiz + flashcards in one shot
    const { summary, quiz, flashcards } = await groqService.generateVideoContent(title, description, transcript);

    return NextResponse.json({ summary, quiz, flashcards });

  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
