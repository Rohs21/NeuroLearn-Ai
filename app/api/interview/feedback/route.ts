import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const mockIdRef = searchParams.get('mockIdRef');
    if (!mockIdRef) {
      return NextResponse.json({ success: false, error: 'mockIdRef is required' });
    }
    const result = await prisma.userAnswer.findMany({
      where: { mockIdRef },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : error });
  }
}
