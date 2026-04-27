'use client';

import { useState, useEffect, useMemo } from 'react';
import { signOut, useSession, signIn } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GraduationCap, BookOpen, Clock, History,
  ArrowRight, Play, Briefcase, Bell,
  CheckCircle2, Circle, Flame, Trophy,
  Plus, BarChart2, Target, Layers, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { InterviewList } from './_components/InterviewList';
import { AddInterview } from './_components/AddInterview';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  totalPlaylists: number;
  totalVideos: number;
  completedVideos: number;
  totalWatchTime: number;
  totalInterviews: number;
};

type WatchHistory = {
  id: string;
  videoId: string;
  video: { title: string; youtubeId: string; thumbnail?: string };
  watchTime?: number;
  completed: boolean;
  viewedAt: string;
};

type Playlist = {
  id: string;
  title: string;
  description?: string;
  videos: any[];
  createdAt: string;
};

type ActivityDay = { date: string; count: number };

type StreakData = {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  activity: ActivityDay[];
};

// ─── Palette for playlist cards ───────────────────────────────────────────────
const CARD_GRADIENTS = [
  'from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900',
  'from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800',
  'from-zinc-300 to-zinc-400 dark:from-zinc-900 dark:to-zinc-950',
];

// ─── LeetCode Heatmap ─────────────────────────────────────────────────────────
function HeatmapCell({ count, date }: { count: number; date: string }) {
  const intensity =
    count === 0 ? 'bg-muted'
    : count === 1 ? 'bg-primary/25'
    : count === 2 ? 'bg-primary/55'
    : count >= 3  ? 'bg-primary'
    : 'bg-muted';

  return (
    <div
      title={`${date}: ${count} video${count !== 1 ? 's' : ''}`}
      className={`h-3 w-3 rounded-sm ${intensity} transition-colors cursor-default hover:ring-1 hover:ring-primary/60`}
    />
  );
}

function LeetCodeHeatmap({ activity, currentStreak, longestStreak, totalDays }: StreakData) {
  // Pad so grid starts on Sunday
  const firstDate = activity.length > 0 ? new Date(activity[0].date + 'T00:00:00Z') : new Date();
  const startOffset = firstDate.getUTCDay(); // 0=Sun
  const padded: (ActivityDay | null)[] = [
    ...Array(startOffset).fill(null),
    ...activity,
  ];
  // Build weeks (columns of 7)
  const weeks: (ActivityDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find(d => d !== null) as ActivityDay | undefined;
    if (firstReal) {
      const m = new Date(firstReal.date + 'T00:00:00Z').getUTCMonth();
      if (m !== lastMonth) {
        monthLabels.push({
          label: new Date(firstReal.date + 'T00:00:00Z').toLocaleString('default', { month: 'short' }),
          col: wi,
        });
        lastMonth = m;
      }
    }
  });

  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="space-y-3">
      {/* Streak stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">day streak</p>
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{longestStreak}</p>
            <p className="text-[10px] text-muted-foreground">longest</p>
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{totalDays}</p>
            <p className="text-[10px] text-muted-foreground">active days</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1.5 mt-5">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="text-[9px] text-muted-foreground h-3 flex items-center w-6">{d}</span>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex flex-col gap-0">
            {/* Month row */}
            <div className="flex gap-[3px] mb-1 h-4">
              {weeks.map((_, wi) => {
                const ml = monthLabels.find(m => m.col === wi);
                return (
                  <div key={wi} className="w-3 flex items-center">
                    {ml && <span className="text-[9px] text-muted-foreground whitespace-nowrap">{ml.label}</span>}
                  </div>
                );
              })}
            </div>
            {/* Cells grid — render day-by-day */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }, (_, di) => {
                    const cell = week[di];
                    return cell ? (
                      <HeatmapCell key={di} count={cell.count} date={cell.date} />
                    ) : (
                      <div key={di} className="h-3 w-3" />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {['bg-muted', 'bg-primary/25', 'bg-primary/55', 'bg-primary'].map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

// ─── Playlist Card ─────────────────────────────────────────────────────────────
function PlaylistCard({ playlist, index }: { playlist: Playlist; index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const videoCount = Array.isArray(playlist.videos) ? playlist.videos.length : 0;
  const initial = playlist.title.slice(0, 2).toUpperCase();

  return (
    <Link href={`/playlist/${playlist.id}`}>
      <div className="group cursor-pointer rounded-[2rem] border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl hover:shadow-xl hover:border-primary/40 transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Gradient banner */}
        <div className={`bg-gradient-to-br ${gradient} h-28 flex items-center justify-center relative border-b border-zinc-200 dark:border-white/10`}>
          <span className="text-4xl font-medium text-black/10 dark:text-white/10 select-none absolute inset-0 flex items-center justify-center tracking-widest">
            {initial}
          </span>
          <div className="relative z-10 h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          {/* video count badge */}
          <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {videoCount} videos
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-snug">
            {playlist.title}
          </h3>
          {playlist.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{playlist.description}</p>
          )}
          <div className="flex items-center justify-between mt-auto pt-2 border-t">
            <span className="text-[10px] text-muted-foreground">
              {new Date(playlist.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = ['Dashboard', 'Playlists', 'Interviews', 'History'] as const;
type Section = 'playlists' | 'interviews' | 'history';

function navToSection(nav: string): Section | null {
  if (nav === 'Playlists') return 'playlists';
  if (nav === 'Interviews') return 'interviews';
  if (nav === 'History') return 'history';
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [refreshInterviews, setRefreshInterviews] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [activeSection, setActiveSection] = useState<Section>('playlists');

  const [stats, setStats] = useState<Stats>({
    totalPlaylists: 0, totalVideos: 0, completedVideos: 0,
    totalWatchTime: 0, totalInterviews: 0,
  });
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0, longestStreak: 0, totalDays: 0, activity: [],
  });
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadPlaylists();
      loadHistory();
      loadInterviewStats();
      loadStreak();
    }
  }, [sessionStatus, refreshInterviews]);

  const loadPlaylists = async () => {
    try {
      setPlaylistsLoading(true);
      const res = await fetch('/api/user/playlists', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setRecentPlaylists(data);
      setStats(prev => ({
        ...prev,
        totalPlaylists: data.length,
        totalVideos: data.reduce((s: number, p: Playlist) => s + (p.videos?.length || 0), 0),
      }));
    } finally { setPlaylistsLoading(false); }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/history', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const history: WatchHistory[] = data.history || [];
      setWatchHistory(history);
      const completedCount = history.filter(h => h.completed).length;
      const totalWatchTime = history.reduce((s, h) => s + (h.watchTime ?? 0), 0);
      setStats(prev => ({ ...prev, completedVideos: completedCount, totalWatchTime }));
    } finally { setHistoryLoading(false); }
  };

  const loadInterviewStats = async () => {
    try {
      const res = await fetch('/api/interview/list', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.result)) {
        setStats(prev => ({ ...prev, totalInterviews: data.result.length }));
      }
    } catch { /* silent */ }
  };

  const loadStreak = async () => {
    try {
      const res = await fetch('/api/dashboard/streak', { credentials: 'include' });
      if (!res.ok) return;
      const d = await res.json();
      setStreakData({
        currentStreak: d.currentStreak ?? 0,
        longestStreak: d.longestStreak ?? 0,
        totalDays: d.totalDays ?? 0,
        activity: d.activity ?? [],
      });
    } catch { /* silent */ }
  };

  // weekly bar chart data
  const weeklyActivity = useMemo(() => {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return {
        day: DAYS[d.getDay()],
        value: watchHistory.filter(h => h.viewedAt?.slice(0, 10) === dateStr).length,
      };
    });
  }, [watchHistory]);

  const completionPct = stats.totalVideos > 0
    ? Math.round((stats.completedVideos / stats.totalVideos) * 100) : 0;

  const donutData = [
    { name: 'Completed', value: stats.completedVideos || 0 },
    { name: 'Remaining', value: Math.max(0, stats.totalVideos - stats.completedVideos) },
  ];

  function handleNav(nav: string) {
    setActiveNav(nav);
    const s = navToSection(nav);
    if (s) setActiveSection(s);
  }

  function handleSectionTab(s: Section) {
    setActiveSection(s);
    const navName = s === 'playlists' ? 'Playlists' : s === 'interviews' ? 'Interviews' : 'History';
    setActiveNav(navName);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col relative z-10 overflow-hidden">
      {/* Subtle Background glow effects for glassmorphism */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-zinc-300/30 dark:bg-zinc-700/30 rounded-full blur-[120px]" />

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-2xl sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">NeuroLearn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_LINKS.map(nav => (
              <button
                key={nav}
                onClick={() => handleNav(nav)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeNav === nav
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {nav}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <button className="h-8 w-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            {isMounted && sessionStatus === 'authenticated' && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title="Sign out"
                className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold uppercase"
              >
                {session?.user?.name?.[0] ?? 'U'}
              </button>
            )}
            {isMounted && sessionStatus !== 'authenticated' && sessionStatus !== 'loading' && (
              <Button size="sm" onClick={() => signIn(undefined, { callbackUrl: '/dashboard' })}>Login</Button>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MAIN ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-6 py-6 min-w-0">

          {sessionStatus === 'loading' && (
            <div className="flex items-center justify-center h-64">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </div>
          )}

          {isMounted && sessionStatus !== 'loading' && (
            <>
              {/* ── HERO BANNER ────────────────────────────────── */}
              <div className="mb-8 relative overflow-hidden bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <GraduationCap className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs font-medium mb-4 backdrop-blur-md">
                    <span className="flex h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
                    Live Learning Dashboard
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-3 text-zinc-900 dark:text-white">
                    Welcome back, <span>{session?.user?.name?.split(' ')[0] ?? 'Learner'}</span>
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
                    You're making great progress. Jump right back into your playlists or start a new mock interview to test your knowledge.
                  </p>
                </div>
              </div>

              {/* ── ROW 1: ANALYTICS | COMPLETION | HEATMAP ────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

                {/* Bar chart */}
                <Card className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border-white/40 dark:border-white/10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                          <BarChart2 className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        Analytics
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Daily videos watched — last 7 days</p>
                    </div>
                    <span className="text-[10px] border rounded px-2 py-0.5 text-muted-foreground">Week</span>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-bold">{Math.round(stats.totalWatchTime / 60)}</span>
                      <span className="text-sm text-muted-foreground">hrs total</span>
                    </div>
                    <div className="flex gap-4 mb-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Watched
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart data={weeklyActivity} barSize={14}>
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip
                          cursor={false}
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                          formatter={(v: any) => [`${v} video${v !== 1 ? 's' : ''}`, '']}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Donut completion */}
                <Card className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border-white/40 dark:border-white/10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <Target className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      Completion
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Overall progress</p>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-0 gap-3">
                    <div className="relative">
                      <ResponsiveContainer width={150} height={150}>
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%" cy="50%"
                            innerRadius={46} outerRadius={68}
                            startAngle={90} endAngle={-270}
                            dataKey="value" strokeWidth={0}
                          >
                            <Cell fill="hsl(var(--primary))" />
                            <Cell fill="hsl(var(--muted))" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold">{completionPct}%</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">done</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                      <div className="rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/5 p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">{stats.completedVideos}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Completed</p>
                      </div>
                      <div className="rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/5 p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">{stats.totalVideos}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* LeetCode heatmap */}
                <Card className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border-white/40 dark:border-white/10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <Flame className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      Learning Activity
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Videos completed per day</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {streakData.activity.length > 0 ? (
                      <LeetCodeHeatmap {...streakData} />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                        No activity yet — start watching!
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── ROW 2: SECTION CONTENT ──────────────────────── */}
              <div>
                {/* Section header + tab switcher */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {activeSection === 'playlists' && 'Your Playlists'}
                      {activeSection === 'interviews' && 'Mock Interviews'}
                      {activeSection === 'history' && 'Watch History'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeSection === 'playlists' && `${stats.totalPlaylists} playlists created`}
                      {activeSection === 'interviews' && `${stats.totalInterviews} interviews total`}
                      {activeSection === 'history' && `${watchHistory.length} videos watched`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex p-1 gap-0.5 bg-muted rounded-lg">
                      {(['playlists', 'interviews', 'history'] as Section[]).map(s => (
                        <button
                          key={s}
                          onClick={() => handleSectionTab(s)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                            activeSection === s
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {activeSection === 'interviews' && (
                      <AddInterview onSuccess={() => setRefreshInterviews(r => !r)} />
                    )}
                  </div>
                </div>

                {/* Playlists */}
                {activeSection === 'playlists' && (
                  playlistsLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                    </div>
                  ) : recentPlaylists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-200 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm rounded-[2rem] gap-2">
                      <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground font-medium">No playlists yet</p>
                      <p className="text-xs text-muted-foreground">Search a topic on the home page to create one</p>
                      <Link href="/">
                        <Button size="sm" variant="outline" className="mt-2 gap-1">
                          <Plus className="h-3 w-3" /> Create Playlist
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {recentPlaylists.map((playlist, i) => (
                        <PlaylistCard key={playlist.id} playlist={playlist} index={i} />
                      ))}
                    </div>
                  )
                )}

                {/* Interviews */}
                {activeSection === 'interviews' && (
                  <InterviewList
                    isLoading={false}
                    error={null}
                    onRefresh={() => setRefreshInterviews(r => !r)}
                  />
                )}

                {/* History */}
                {activeSection === 'history' && (
                  historyLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                    </div>
                  ) : watchHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-200 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm rounded-[2rem] gap-2">
                      <History className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground font-medium">No watch history yet</p>
                      <p className="text-xs text-muted-foreground">Start watching videos to build your history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {watchHistory.map(item => (
                        <Link key={item.id} href={`/watch?v=${item.video.youtubeId}`}>
                          <div className="group flex items-center gap-4 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Play className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {item.video.title}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(item.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {item.watchTime ? (
                                  <span className="text-[10px] text-muted-foreground">{item.watchTime}s</span>
                                ) : null}
                              </div>
                            </div>
                            {item.completed ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-[10px] text-green-600 font-medium hidden sm:block">Done</span>
                              </div>
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ───────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-64 shrink-0 border-l border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-2xl overflow-y-auto relative z-20">

          {/* User profile mini */}
          <div className="p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-medium text-sm shrink-0">
                {isMounted ? (session?.user?.name?.[0]?.toUpperCase() ?? 'U') : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{isMounted ? (session?.user?.name ?? 'Learner') : 'Learner'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isMounted ? (session?.user?.email ?? '') : ''}</p>
              </div>
            </div>
          </div>

          {/* Stats — clean list */}
          <div className="p-5 border-b space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Overview</p>
            {[
              { icon: BookOpen, label: 'Playlists', value: stats.totalPlaylists },
              { icon: Play, label: 'Videos total', value: stats.totalVideos },
              { icon: CheckCircle2, label: 'Completed', value: stats.completedVideos },
              { icon: Clock, label: 'Watch time', value: `${Math.round(stats.totalWatchTime / 60)}h` },
              { icon: Briefcase, label: 'Interviews', value: stats.totalInterviews },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/60 transition-colors">
                <div className={`h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <span className="text-sm font-medium tabular-nums">{value}</span>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="p-5 flex-1 min-h-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Recent Activity
            </p>
            {watchHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-8">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {watchHistory.slice(0, 7).map(item => (
                  <Link key={item.id} href={`/watch?v=${item.video.youtubeId}`}>
                    <div className="group flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${item.completed ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {item.video.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(item.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="p-4 border-t">
            <Link href="/">
              <Button variant="default" size="sm" className="w-full gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Playlist
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
