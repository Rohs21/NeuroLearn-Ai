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
	try {
		// @ts-ignore
		return await handler(req)
	} catch (e) {
		console.error('[NextAuth][route] GET handler error', e)
		// Return a JSON error response to help debugging deployment issues.
		// Avoid leaking secrets; present only the error message.
		return NextResponse.json({ error: String(e), message: 'NextAuth GET handler error' }, { status: 500 })
	}
}

export async function POST(req: NextRequest) {
	try {
		console.log('[NextAuth][route] POST', req.url)
	} catch (e) {
		console.warn('[NextAuth][route] POST logging failed', e)
	}
	try {
		// @ts-ignore
		return await handler(req)
	} catch (e) {
		console.error('[NextAuth][route] POST handler error', e)
		return NextResponse.json({ error: String(e), message: 'NextAuth POST handler error' }, { status: 500 })
	}
}