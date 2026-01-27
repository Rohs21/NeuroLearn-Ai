import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Session } from "next-auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } }
    
    if (!session?.user?.id) {
      console.log('[API][history] No session found. Session:', session);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('[API][history] Session found for user:', session.user.id);

  const history = await prisma.history.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        video: true,
      },
      orderBy: {
        viewedAt: "desc",
      },
      take: 10
    })

    // Get total count of all videos the user has viewed
    const totalVideoCount = await prisma.history.count({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ history, totalVideoCount })
  } catch (error) {
    console.error("Error fetching history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } }
    
    if (!session?.user?.id) {
      console.log('[API][history-post] No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('[API][history-post] Session found for user:', session.user.id);

    const { videoId, watchTime, completed, title, description, thumbnailUrl, duration } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Check current history count
    const historyCount = await prisma.history.count({
      where: { userId: session.user.id }
    });

    // If user has 10 or more history entries, delete the oldest one
    if (historyCount >= 10) {
      const oldestHistory = await prisma.history.findFirst({
        where: { userId: session.user.id },
        orderBy: { viewedAt: 'asc' },
        select: { id: true }
      });

      if (oldestHistory) {
        await prisma.history.delete({
          where: { id: oldestHistory.id }
        });
      }
    }

    // Ensure video exists
    let video = await prisma.video.findUnique({
      where: { youtubeId: videoId }
    });

    if (!video) {
      video = await prisma.video.create({
        data: {
          youtubeId: videoId,
          title: title || "",
          description: description || "",
          thumbnail: thumbnailUrl || "",
          duration: duration || "",
          userId: session.user.id
        }
      });
    }

    // Check if history entry already exists
    const existingHistory = await prisma.history.findFirst({
      where: {
        userId: session.user.id,
        videoId: video.id, // Use the database video ID, not YouTube ID
      },
    });

    let history;
    if (existingHistory) {
      // Update existing history
      history = await prisma.history.update({
        where: {
          id: existingHistory.id,
        },
        data: {
          watchTime: watchTime || existingHistory.watchTime,
          completed: completed !== undefined ? completed : existingHistory.completed,
          viewedAt: new Date(),
        },
        include: {
          video: true,
        },
      });
    } else {
      // Create new history entry
      history = await prisma.history.create({
        data: {
          userId: session.user.id,
          videoId: video.id, // Use the database video ID, not YouTube ID
          watchTime: watchTime || 0,
          completed: completed || false,
        },
        include: {
          video: true,
        },
      });
    }

    return NextResponse.json({ history }, { status: 201 })
  } catch (error) {
    console.error("Error creating/updating history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}