import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, jobDescription } = await request.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    const geminiService = new GeminiService();
    const curatedData = await geminiService.enhanceJobKeywords(jobTitle, jobDescription);

    return NextResponse.json(curatedData, { headers: corsHeaders });
  } catch (error) {
    console.error('Curate Keywords API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced data.' },
      { status: 500, headers: corsHeaders }
    );
  }
}