import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth/next"

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest) {
	try {
		console.log('[NextAuth][route] GET', req.url)
	} catch (e) {
		console.warn('[NextAuth][route] GET logging failed', e)
	}
	// Forward to NextAuth handler
	// @ts-ignore
	return handler(req)
}

export async function POST(req: NextRequest) {
	try {
		console.log('[NextAuth][route] POST', req.url)
	} catch (e) {
		console.warn('[NextAuth][route] POST logging failed', e)
	}
	// @ts-ignore
	return handler(req)
}