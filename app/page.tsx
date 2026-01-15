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
import { Navbar } from '@/components/navbar';

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
        credentials: 'include',
        body: JSON.stringify({ query, language, difficulty }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      if (data.playlist) {
        // Always try to save the playlist and get a unique URL
        try {
          const saveResponse = await fetch('/api/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title: `Learning Path: ${query}`,
              description: `AI-curated learning path for ${query} (${language}, ${difficulty})`,
              videos: data.playlist
            }),
          });
          
          if (saveResponse.ok) {
            const savedData = await saveResponse.json();
            // Redirect to the playlist page
            router.push(`/playlist/${savedData.id}`);
            return;
          } else {
            // If saving fails (e.g., user not authenticated), show in current page
            setPlaylist(data.playlist);
          }
        } catch (err) {
          console.error('Failed to save playlist:', err);
          setPlaylist(data.playlist);
        }
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
      <Navbar showAuthButtons={true} isAuthenticated={status === "authenticated"} />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {!playlist && !isLoading && (
          <>
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 px-2">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Learning</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
                Learn Anything with
                <span className="text-primary"> Intelligent</span> Curation
              </h2>
              
              <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                Discover personalized learning paths with AI-curated YouTube content. 
                Get structured playlists, summaries, and quizzes tailored to your learning style.
              </p>
            </div>

            {/* Search Section */}
            <div className="mb-10 sm:mb-16">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-16 max-w-5xl mx-auto">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">AI Curation</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Smart algorithms find the best educational videos from across YouTube
                </p>
              </div>
              
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Structured Learning</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Videos organized from beginner to advanced with progress tracking
                </p>
              </div>
              
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Interactive Learning</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  AI-generated summaries and quizzes to enhance understanding
                </p>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-10 sm:py-16">
            <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Curating Your Learning Path</h3>
            <p className="text-sm sm:text-base text-muted-foreground">AI is finding the best educational content for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-10 sm:py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-lg sm:text-xl">⚠️</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Search Error</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
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