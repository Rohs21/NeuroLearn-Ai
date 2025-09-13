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

    const videos = await prisma.video.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Error fetching videos:", error)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { youtubeId, title, description, thumbnail, duration } = await req.json()

    if (!youtubeId || !title) {
      return NextResponse.json(
        { error: "YouTube ID and title are required" },
        { status: 400 }
      )
    }

    // Check if video already exists for this user
    const existingVideo = await prisma.video.findFirst({
      where: {
        youtubeId,
        userId: session.user.id,
      },
    })

    if (existingVideo) {
      return NextResponse.json({ video: existingVideo })
    }

    const video = await prisma.video.create({
      data: {
        youtubeId,
        title,
        description,
        thumbnail,
        duration,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}