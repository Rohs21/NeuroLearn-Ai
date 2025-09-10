'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/video-player';
import { PlaylistSidebar } from '@/components/playlist-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap } from 'lucide-react';

function WatchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get('v');
  const playlistData = searchParams.get('playlist');

  const [videoData, setVideoData] = useState({
    title: 'Loading video...',
    description: '',
    channelTitle: '',
    difficulty: 'beginner',
  });

  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    if (videoId) {
      // In a real app, you'd fetch video metadata from your database
      // For now, we'll use YouTube API or show placeholder data
      setVideoData({
        title: 'Educational Video',
        description: 'This is a placeholder description for the educational video.',
        channelTitle: 'Educational Channel',
        difficulty: 'beginner',
      });
    }

    // Load playlist data from localStorage or URL parameter
    if (playlistData) {
      try {
        setPlaylist(JSON.parse(decodeURIComponent(playlistData)));
      } catch (error) {
        console.error('Failed to parse playlist data:', error);
      }
    }
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <Button onClick={() => router.push('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">NeuroLearn-AI</h1>
              </div>
            </div>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Video Player Section */}
        <div className="flex-1 p-4">
          <div className="max-w-5xl">
            <VideoPlayer
              videoId={videoId}
              title={videoData.title}
              description={videoData.description}
              channelTitle={videoData.channelTitle}
              difficulty={videoData.difficulty}
              onComplete={() => {
                // Handle video completion
                console.log('Video completed');
              }}
              onNext={() => {
                // Navigate to next video in playlist
                if (playlist && playlist.videos) {
                  const currentIndex = playlist.videos.findIndex(v => v.id === videoId);
                  const nextVideo = playlist.videos[currentIndex + 1];
                  if (nextVideo) {
                    router.push(`/watch?v=${nextVideo.id}&playlist=${encodeURIComponent(JSON.stringify(playlist))}`);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Playlist Sidebar */}
        {playlist && (
          <div className="w-96 border-l bg-background/50 backdrop-blur-sm">
            <PlaylistSidebar
              playlist={playlist}
              currentVideoId={videoId}
              onVideoSelect={(selectedVideoId) => {
                router.push(`/watch?v=${selectedVideoId}&playlist=${encodeURIComponent(JSON.stringify(playlist))}`);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchPageContent />
    </Suspense>
  );
}