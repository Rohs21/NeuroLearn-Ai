import { NextRequest, NextResponse } from 'next/server';
import { GroqService } from '@/lib/services/groq';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { jobPosition, jobDesc, jobExperience, questionCount = 10 } = await request.json();

    if (!jobPosition || !jobDesc || !jobExperience) {
      return NextResponse.json({ error: 'jobPosition, jobDesc, and jobExperience are required' }, { status: 400 });
    }

    const groqService = new GroqService();
    const rawJson = await groqService.generateInterviewQuestions(
      jobPosition,
      jobDesc,
      jobExperience,
      Number(questionCount)
    );

    const questions = JSON.parse(rawJson);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format returned');
    }

    return NextResponse.json({ success: true, questions, rawJson });
  } catch (error) {
    console.error('Interview generate error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to generate questions' }, { status: 500 });
  }
}
