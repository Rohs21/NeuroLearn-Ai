import { NextResponse } from 'next/server'

// Minimal GET handler to satisfy the app router and provide a safe default.
// Expand this to return real search-history data when available.
export async function GET() {
	try {
		return NextResponse.json({ searchHistory: [] })
	} catch (err) {
		return NextResponse.json({ searchHistory: [] }, { status: 500 })
	}
}
