'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, BookOpen, Clock, TrendingUp, Star, History } from 'lucide-react';

// ---------- Types ----------
type Stats = {
  totalPlaylists: number;
  totalVideos: number;
  completedVideos: number;
  totalWatchTime: number;
};

type SearchHistoryItem = {
  query: string;
  createdAt: string;
  resultsCount: number;
};

type Playlist = {
  id: string;
  title: string;
  videoCount: number;
};

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

// ---------- Component ----------
export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPlaylists: 0,
    totalVideos: 0,
    completedVideos: 0,
    totalWatchTime: 0,
  });

  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // In a real app, you'd fetch this from your API
    setStats({
      totalPlaylists: 12,
      totalVideos: 145,
      completedVideos: 89,
      totalWatchTime: 2340, // minutes
    });

    setSearchHistory([
      { query: 'React.js tutorial', createdAt: '2024-01-15', resultsCount: 25 },
      { query: 'Python machine learning', createdAt: '2024-01-14', resultsCount: 30 },
      { query: 'JavaScript fundamentals', createdAt: '2024-01-13', resultsCount: 18 },
    ]);
  };

  const completionPercentage =
    stats.totalVideos > 0 ? (stats.completedVideos / stats.totalVideos) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">NeuroLearn-AI</h1>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">Profile</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome back! 👋</h2>
            <p className="text-muted-foreground">Continue your learning journey</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Playlists</p>
                    <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Videos Watched</p>
                    <p className="text-2xl font-bold">{stats.completedVideos}/{stats.totalVideos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Watch Time</p>
                    <p className="text-2xl font-bold">{Math.round(stats.totalWatchTime / 60)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">{Math.round(completionPercentage)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Overall Completion</span>
                  <span>{stats.completedVideos} of {stats.totalVideos} videos</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Keep going! You're doing great with your learning journey.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
              <TabsTrigger value="history">Search History</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Continue Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your recent playlists will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Search History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchHistory.map((search, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{search.query}</p>
                          <p className="text-sm text-muted-foreground">
                            {search.resultsCount} videos found • {search.createdAt}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">Search Again</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookmarks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Bookmarked Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your bookmarked playlists and videos will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
