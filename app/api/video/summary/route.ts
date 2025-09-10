import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const geminiService = new GeminiService();

    // Generate AI summary
    const summary = await geminiService.generateVideoSummary(title, description);
    
    // Generate quiz questions
    const quiz = await geminiService.generateQuiz(title, description);

    return NextResponse.json({
      summary,
      quiz
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary and quiz' },
      { status: 500 }
    );
  }
}