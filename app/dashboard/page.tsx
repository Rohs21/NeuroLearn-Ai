'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession, signIn } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, BookOpen, Clock, TrendingUp, History, ArrowRight, Play, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { InterviewList } from './_components/InterviewList';
import { AddInterview } from './_components/AddInterview';

// ---------- Types ----------
type Stats = {
  totalPlaylists: number;
  totalVideos: number;
  completedVideos: number;
  totalWatchTime: number;
  totalInterviews?: number;
};

type SearchHistoryItem = {
  query: string;
  createdAt: string;
  resultsCount: number;
  video?: {
    title?: string;
    youtubeId?: string;
    // Add other video properties if needed
  };
  watchTime?: number;
  completed?: boolean;
  viewedAt?: string;
};

type Playlist = {
  id: string;
  title: string;
  description?: string;
  videos: any[];
  createdAt: string;
};

type WatchHistory = {
  id: string;
  videoId: string;
  video: {
    title: string;
    youtubeId: string;
    thumbnail?: string;
  };
  watchTime?: number;
  completed: boolean;
  viewedAt: string;
};

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

type Badge = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  awardedAt: string;
  moduleId?: string;
};

// ---------- Component ----------
export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [refreshInterviews, setRefreshInterviews] = useState(false);
  // All state should be initialized empty, to be filled with dynamic data from API
  const [stats, setStats] = useState<Stats>({
    totalPlaylists: 0,
    totalVideos: 0,
    completedVideos: 0,
    totalWatchTime: 0,
    totalInterviews: 0,
  });
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadPlaylistHistory();
      loadWatchHistory();
      loadInterviewStats();
    }
  }, [sessionStatus, refreshInterviews]);

  const loadPlaylistHistory = async () => {
    try {
      setPlaylistsLoading(true);
      setPlaylistsError(null);
      
      const response = await fetch('/api/user/playlists', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const playlists = await response.json();
      setRecentPlaylists(playlists);
      
      // Update stats based on playlist count
      // Calculate total videos as playlists * 20 (since each playlist generates ~20 videos from YouTube API)
      setStats(prev => ({
        ...prev,
        totalPlaylists: playlists.length,
        totalVideos: playlists.length * 20
      }));
    } catch (error) {
      console.error('Failed to load playlist history:', error);
      setPlaylistsError('Failed to load playlists');
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const loadWatchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      
      const response = await fetch('/api/history', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }

      const data = await response.json();
      setWatchHistory(data.history || []);
      
      // Update stats based on history - only update completed count
      const completedCount = (data.history || []).filter((h: WatchHistory) => h.completed).length;
      setStats(prev => ({
        ...prev,
        completedVideos: completedCount
      }));
    } catch (error) {
      console.error('Failed to load watch history:', error);
      setHistoryError('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadInterviewStats = async () => {
    try {
      const response = await fetch('/api/interview/list', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.result)) {
        setStats(prev => ({
          ...prev,
          totalInterviews: data.result.length
        }));
      }
    } catch (error) {
      console.error('Failed to load interview stats:', error);
    }
  };

  // const loadDashboardData = async () => {
  //   // Fetch stats, search history, badges, etc. from your API here
  // };

  const completionPercentage =
    stats.totalVideos > 0 ? (stats.completedVideos / stats.totalVideos) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">NeuroLearn</h1>
            </Link>

            <div className="flex items-center gap-4">
              {isMounted && (
                <>
                  {sessionStatus === 'authenticated' ? (
                    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                      Logout
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => signIn(undefined, { callbackUrl: '/dashboard' })}>
                      Login
                    </Button>
                  )}
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {sessionStatus === 'loading' && (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}

        {sessionStatus === 'unauthenticated' && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">Welcome</h2>
                <p className="text-muted-foreground mb-4">Sign in to view your learning dashboard.</p>
                <Button onClick={() => signIn(undefined, { callbackUrl: '/dashboard' })} className="w-full">Sign in</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isMounted && sessionStatus === 'authenticated' && (
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name || 'Learner'}!</h2>
              <p className="text-muted-foreground">Continue your learning journey</p>
            </div>

            {/* Stats Grid - Enhanced Style */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Playlists Created</p>
                      <p className="text-4xl font-bold mt-2 text-blue-900 dark:text-blue-100">{stats.totalPlaylists}</p>
                    </div>
                    <BookOpen className="h-12 w-12 text-blue-300 dark:text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">Videos Completed</p>
                      <p className="text-4xl font-bold mt-2 text-green-900 dark:text-green-100">{stats.completedVideos}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">of {stats.totalVideos}</p>
                    </div>
                    <Play className="h-12 w-12 text-green-300 dark:text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Watch Time</p>
                      <p className="text-4xl font-bold mt-2 text-purple-900 dark:text-purple-100">{Math.round(stats.totalWatchTime / 60)}h</p>
                    </div>
                    <Clock className="h-12 w-12 text-purple-300 dark:text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Completion Rate</p>
                      <p className="text-4xl font-bold mt-2 text-orange-900 dark:text-orange-100">{Math.round(completionPercentage)}%</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-orange-300 dark:text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border border-red-200 dark:border-red-800 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">Mock Interviews</p>
                      <p className="text-4xl font-bold mt-2 text-red-900 dark:text-red-100">{stats.totalInterviews || 0}</p>
                    </div>
                    <Briefcase className="h-12 w-12 text-red-300 dark:text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="playlists" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="playlists" className="text-base">Your Playlists</TabsTrigger>
                <TabsTrigger value="interviews" className="text-base">Interviews</TabsTrigger>
                <TabsTrigger value="history" className="text-base">History</TabsTrigger>
              </TabsList>

              {/* Playlists Tab */}
              <TabsContent value="playlists" className="space-y-4">
                {playlistsLoading ? (
                  <Card>
                    <CardContent className="p-12 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading playlists...</p>
                    </CardContent>
                  </Card>
                ) : playlistsError ? (
                  <Card className="border-destructive/50">
                    <CardContent className="p-6">
                      <p className="text-destructive font-medium">{playlistsError}</p>
                    </CardContent>
                  </Card>
                ) : recentPlaylists.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">No playlists yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Create one by searching for a topic on the home page</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentPlaylists.map((playlist) => (
                      <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                        <Card className="cursor-pointer border border-border shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 h-full">
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base truncate text-foreground hover:text-primary transition-colors">{playlist.title}</h3>
                                {playlist.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{playlist.description}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                    <Play className="h-3 w-3" />
                                    {Array.isArray(playlist.videos) ? playlist.videos.length : 0}
                                  </span>
                                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    <Clock className="h-3 w-3" />
                                    {new Date(playlist.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Interviews Tab */}
              <TabsContent value="interviews" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your Mock Interviews</h3>
                  <AddInterview onSuccess={() => setRefreshInterviews(!refreshInterviews)} />
                </div>
                <InterviewList isLoading={false} error={null} onRefresh={() => setRefreshInterviews(!refreshInterviews)} />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                {historyLoading ? (
                  <Card>
                    <CardContent className="p-12 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading watch history...</p>
                    </CardContent>
                  </Card>
                ) : historyError ? (
                  <Card className="border-destructive/50">
                    <CardContent className="p-6">
                      <p className="text-destructive font-medium">{historyError}</p>
                    </CardContent>
                  </Card>
                ) : watchHistory.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">No watch history yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start watching videos to build your history</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {watchHistory.map((item) => (
                      <Link key={item.id} href={`/watch?v=${item.video.youtubeId}`}>
                        <Card className="cursor-pointer border border-border shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold text-base truncate text-foreground hover:text-primary transition-colors">{item.video.title}</h3>
                                  {item.completed && (
                                    <span className="flex-shrink-0 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-300 dark:border-green-700">
                                      ✓ Completed
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.viewedAt).toLocaleDateString()}
                                  </span>
                                  {item.watchTime && (
                                    <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                      <Play className="h-3 w-3" />
                                      {item.watchTime} sec
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
