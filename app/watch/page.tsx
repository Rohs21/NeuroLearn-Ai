'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/video-player';
import { PlaylistSidebar } from '@/components/playlist-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/navbar';

function WatchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get('v');
  const [playlistData, setPlaylistData] = useState(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);

  const [videoData, setVideoData] = useState({
    title: 'Loading video...',
    description: '',
    channelTitle: '',
    difficulty: 'beginner',
  });

  type Video = {
    id: string;
    title: string;
    description: string;
    channelTitle: string;
    duration: string;
    thumbnailUrl: string;
    difficulty: string;
    order: number;
    isCompleted?: boolean;
    [key: string]: any;
  };
  type Playlist = {
    title: string;
    description: string;
    totalVideos: number;
    completedVideos: number;
    videos: Video[];
    [key: string]: any;
  };
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    // Load playlist from localStorage
    let loadedPlaylist = null;
    try {
      const stored = localStorage.getItem('neuro_playlist');
      if (stored) {
        loadedPlaylist = JSON.parse(stored);
        setPlaylist(loadedPlaylist);
        if (loadedPlaylist._playlistId) setPlaylistId(loadedPlaylist._playlistId);
      }
    } catch (error) {
      console.error('Failed to load playlist from localStorage:', error);
    }

    if (videoId && loadedPlaylist && loadedPlaylist.videos) {
      const video = loadedPlaylist.videos.find((v: Video) => v.id === videoId);
      if (video) {
        setVideoData({
          title: video.title,
          description: video.description,
          channelTitle: video.channelTitle || '',
          difficulty: video.difficulty || 'beginner',
        });
        return;
      }
    }
    // fallback placeholder
    setVideoData({
      title: 'Educational Video',
      description: 'This is a placeholder description for the educational video.',
      channelTitle: 'Educational Channel',
      difficulty: 'beginner',
    });
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
    <div className="min-h-screen bg-white dark:bg-[#09090b] relative z-10">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full gap-8 p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto overflow-hidden">
        {/* Video Player Section */}
        <div className={`${playlist ? 'flex-1 min-w-0' : 'w-full'} flex flex-col h-full overflow-y-auto scrollbar-hide rounded-[2rem]`}>
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="w-full pb-24">
            {(videoData.title && videoData.description && videoData.title !== 'Educational Video' && videoData.description !== 'This is a placeholder description for the educational video.') ? (
              <VideoPlayer
                videoId={videoId}
                title={videoData.title}
                description={videoData.description}
                channelTitle={videoData.channelTitle}
                difficulty={videoData.difficulty}
                playlistId={playlistId ?? undefined}
                onComplete={() => {}}
                onVideoCompleted={(completedId) => {
                  setPlaylist((prev: any) => {
                    if (!prev) return prev;
                    const updatedVideos = prev.videos.map((v: Video) =>
                      v.id === completedId ? { ...v, isCompleted: true } : v
                    );
                    const completedVideos = updatedVideos.filter((v: Video) => v.isCompleted).length;
                    const updated = { ...prev, videos: updatedVideos, completedVideos };
                    localStorage.setItem('neuro_playlist', JSON.stringify(updated));
                    return updated;
                  });
                }}
                onNext={() => {
                  if (playlist && playlist.videos) {
                    const currentIndex = playlist.videos.findIndex((v: Video) => v.id === videoId);
                    const nextVideo = playlist.videos[currentIndex + 1];
                    if (nextVideo) router.push(`/watch?v=${nextVideo.id}`);
                  }
                }}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">Loading video details...</div>
            )}
          </div>
        </div>

        {/* Playlist Sidebar */}
        {playlist && (
          <div className="w-full lg:w-[420px] flex-shrink-0 lg:h-full">
            <PlaylistSidebar
              playlist={playlist}
              currentVideoId={videoId}
              onVideoSelect={(selectedVideoId: string) => {
                router.push(`/watch?v=${selectedVideoId}`);
              }}
            />
          </div>
        )}
      </div>
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