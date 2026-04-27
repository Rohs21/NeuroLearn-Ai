import { NextRequest, NextResponse } from 'next/server';
import { GroqService } from '@/lib/services/groq';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json({ error: 'question and userAnswer are required' }, { status: 400 });
    }

    const groqService = new GroqService();
    const feedback = await groqService.generateAnswerFeedback(question, userAnswer);

    return NextResponse.json({ success: true, ...feedback });
  } catch (error) {
    console.error('AI feedback error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to generate feedback' }, { status: 500 });
  }
}
