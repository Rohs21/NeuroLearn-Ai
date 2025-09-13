export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const mockId = searchParams.get('mockId');
    if (!mockId) {
      return NextResponse.json({ success: false, error: 'mockId is required' });
    }
    const result = await prisma.mockInterview.findUnique({
      where: { mockId },
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : error });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // If mockId is present, treat as mockInterview creation (AddInterview page)
    if (body.mockId && body.jsonMockResp) {
      const resp = await prisma.mockInterview.create({
        data: {
          mockId: body.mockId,
          jsonMockResp: body.jsonMockResp,
          jobPosition: body.jobPosition,
          jobDesc: body.jobDesc,
          jobExperience: body.jobExperience,
          createdBy: body.createdBy,
          createdAt: body.createdAt,
        }
      });
      return NextResponse.json({ success: true, data: resp });
    }
    // Otherwise, treat as userAnswer creation (RecordAnswerSection)
    const {
      mockIdRef,
      question,
      correctAns,
      userAns,
      feedback,
      rating,
      userEmail,
      createdAt
    } = body;
    const resp = await prisma.userAnswer.create({
      data: {
        mockIdRef,
        question,
        correctAns,
        userAns,
        feedback,
        rating,
        userEmail,
        createdAt,
      }
    });
    return NextResponse.json({ success: true, data: resp });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : error });
  }
}
