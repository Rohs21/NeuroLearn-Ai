'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/search-bar';
import { PlaylistGrid } from '@/components/playlist-grid';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { GraduationCap, Sparkles, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSearch = async (query: string, language: string, difficulty: string) => {
    setIsLoading(true);
    setError('');
    setPlaylist(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language, difficulty }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      if (data.playlist) {
        setPlaylist(data.playlist);
      } else {
        setError(data.message || 'No videos found for your search.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search videos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoPlay = (videoId: string) => {
    // Save playlist to localStorage before navigating
    if (playlist) {
      localStorage.setItem('neuro_playlist', JSON.stringify(playlist));
    }
    router.push(`/watch?v=${videoId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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
              {status === "authenticated" ? (
                <>
                  <Button variant="default" size="sm" onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => router.push('/auth/signin')}>
                  Sign In
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!playlist && !isLoading && (
          <>
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Learning</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Learn Anything with
                <span className="text-primary"> Intelligent</span> Curation
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Discover personalized learning paths with AI-curated YouTube content. 
                Get structured playlists, summaries, and quizzes tailored to your learning style.
              </p>
            </div>

            {/* Search Section */}
            <div className="mb-16">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">AI Curation</h3>
                <p className="text-sm text-muted-foreground">
                  Smart algorithms find the best educational videos from across YouTube
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">Structured Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Videos organized from beginner to advanced with progress tracking
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">Interactive Learning</h3>
                <p className="text-sm text-muted-foreground">
                  AI-generated summaries and quizzes to enhance understanding
                </p>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Curating Your Learning Path</h3>
            <p className="text-muted-foreground">AI is finding the best educational content for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Search Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => setError('')}>Try Again</Button>
            </div>
          </div>
        )}

        {/* Playlist Results */}
        {playlist && !isLoading && (
          <PlaylistGrid 
            playlist={playlist}
            onVideoPlay={handleVideoPlay}
            onBookmarkPlaylist={() => {
              // Handle playlist bookmarking
              console.log('Bookmark playlist');
            }}
          />
        )}
      </main>
    </div>

  );
}