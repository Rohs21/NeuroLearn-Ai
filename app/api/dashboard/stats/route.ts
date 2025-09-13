import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { Session } from "next-auth"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } }
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user statistics
    const [
      totalVideos,
      totalHistory,
      completedVideos,
      recentHistory
    ] = await Promise.all([
      prisma.video.count({
        where: { userId: session.user.id }
      }),
      prisma.history.count({
        where: { userId: session.user.id }
      }),
      prisma.history.count({
        where: { 
          userId: session.user.id,
          completed: true 
        }
      }),
      prisma.history.findMany({
        where: { userId: session.user.id },
        include: { video: true },
        orderBy: { viewedAt: "desc" },
        take: 5
      })
    ])

    const stats = {
      totalVideos,
      totalWatched: totalHistory,
      completedVideos,
      completionRate: totalHistory > 0 ? Math.round((completedVideos / totalHistory) * 100) : 0,
      recentHistory
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}