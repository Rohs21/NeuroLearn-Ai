import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session & { user: { id: string } };
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all completed history dates for this user
    const history = await prisma.history.findMany({
      where: { userId: session.user.id, completed: true },
      select: { viewedAt: true },
      orderBy: { viewedAt: 'desc' },
    });

    // Deduplicate by calendar day (YYYY-MM-DD in UTC)
    const daySet = new Set<string>();
    for (const h of history) {
      daySet.add(h.viewedAt.toISOString().slice(0, 10));
    }
    const days = Array.from(daySet).sort().reverse(); // most recent first

    // Current streak: consecutive days ending today or yesterday
    let currentStreak = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < days.length; i++) {
      const expected = new Date(today);
      expected.setUTCDate(today.getUTCDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (days[i] === expectedStr) {
        currentStreak++;
      } else {
        // Allow missing today (streak still counts if yesterday was last active)
        if (i === 0 && days[0] !== expectedStr) {
          const yesterday = new Date(today);
          yesterday.setUTCDate(today.getUTCDate() - 1);
          if (days[0] !== yesterday.toISOString().slice(0, 10)) break;
          continue;
        }
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let runStreak = 1;
    const sortedAsc = [...days].reverse();
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = new Date(sortedAsc[i - 1]);
      const curr = new Date(sortedAsc[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        runStreak++;
        longestStreak = Math.max(longestStreak, runStreak);
      } else {
        runStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak, sortedAsc.length > 0 ? 1 : 0);

    // Activity grid: last 30 days with completion counts
    const activityMap = new Map<string, number>();
    for (const h of history) {
      const day = h.viewedAt.toISOString().slice(0, 10);
      activityMap.set(day, (activityMap.get(day) ?? 0) + 1);
    }

    // Activity grid: last 371 days (53 weeks) for LeetCode-style heatmap
    const activity: { date: string; count: number }[] = [];
    for (let i = 370; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      activity.push({ date: dateStr, count: activityMap.get(dateStr) ?? 0 });
    }

    return NextResponse.json({ currentStreak, longestStreak, activity, totalDays: days.length });
  } catch (error) {
    console.error('Streak API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
