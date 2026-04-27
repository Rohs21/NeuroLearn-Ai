'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Calendar } from 'lucide-react';

interface ActivityDay {
  date: string;
  count: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  activity: ActivityDay[];
  totalDays: number;
}

function getColor(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-green-200 dark:bg-green-900';
  if (count === 2) return 'bg-green-400 dark:bg-green-700';
  return 'bg-green-600 dark:bg-green-500';
}

export function StreakTracker() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/streak', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setData({
          currentStreak: d.currentStreak ?? 0,
          longestStreak: d.longestStreak ?? 0,
          totalDays: d.totalDays ?? 0,
          activity: d.activity ?? Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setUTCDate(date.getUTCDate() - (29 - i));
            return { date: date.toISOString().slice(0, 10), count: 0 };
          }),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-32">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const weeks: ActivityDay[][] = [];
  const activity = data.activity ?? [];
  for (let i = 0; i < activity.length; i += 7) {
    weeks.push(activity.slice(i, i + 7));
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-5 w-5 text-orange-500" />
          Learning Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Current</span>
            </div>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{data.currentStreak}</p>
            <p className="text-xs text-orange-500">days</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Longest</span>
            </div>
            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{data.longestStreak}</p>
            <p className="text-xs text-yellow-500">days</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Total</span>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{data.totalDays}</p>
            <p className="text-xs text-green-500">active days</p>
          </div>
        </div>

        {/* 30-day activity heatmap */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Last 30 days</p>
          <div className="flex gap-1">
            {/* Day labels column */}
            <div className="flex flex-col gap-1 mr-1">
              {dayLabels.map((d, i) => (
                <span key={i} className="text-[9px] text-muted-foreground h-3 flex items-center">{d}</span>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date}: ${day.count} video${day.count !== 1 ? 's' : ''} completed`}
                    className={`h-3 w-3 rounded-sm ${getColor(day.count)} transition-colors cursor-default`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {[0, 1, 2, 3].map(n => (
              <div key={n} className={`h-3 w-3 rounded-sm ${getColor(n)}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
