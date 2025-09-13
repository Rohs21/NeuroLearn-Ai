import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('userId');
    if (!userId) {
      // Try to get userId from session
      const session = await getServerSession(authOptions) as { user?: { id?: string } };
      userId = session?.user?.id || null;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const badges = await prisma.badge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
    });
    return NextResponse.json({ badges });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, moduleId, title, description, imageUrl } = await req.json();
    if (!userId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create badge for user
    const badge = await prisma.badge.create({
      data: {
        userId,
        moduleId,
        title,
        description,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, badge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
