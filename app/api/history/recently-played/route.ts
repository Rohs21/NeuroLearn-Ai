import { NextResponse } from 'next/server'

// Minimal GET handler to satisfy the app router and provide a safe default.
// Expand this to return real recently-played data when available.
export async function GET() {
	try {
		return NextResponse.json({ recentlyPlayed: [] })
	} catch (err) {
		return NextResponse.json({ recentlyPlayed: [] }, { status: 500 })
	}
}
