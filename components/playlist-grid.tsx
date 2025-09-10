'use client';

import { VideoCard } from './video-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Star } from 'lucide-react';

interface PlaylistGridProps {
  playlist: {
    id?: string;
    title: string;
    description: string;
    totalVideos: number;
    completedVideos: number;
    videos: any[];
  };
  onVideoPlay: (videoId: string) => void;
  onBookmarkPlaylist?: () => void;
}

export function PlaylistGrid({ playlist, onVideoPlay, onBookmarkPlaylist }: PlaylistGridProps) {
  const progressPercentage = playlist.totalVideos > 0 
    ? (playlist.completedVideos / playlist.totalVideos) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Playlist Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{playlist.title}</h1>
            <p className="text-muted-foreground mb-4">{playlist.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{playlist.totalVideos} videos</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>~{Math.round(playlist.totalVideos * 15)} min total</span>
              </div>
            </div>
          </div>

          {onBookmarkPlaylist && (
            <Button variant="outline" onClick={onBookmarkPlaylist}>
              <Star className="h-4 w-4 mr-2" />
              Bookmark Playlist
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {playlist.completedVideos > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{playlist.completedVideos} of {playlist.totalVideos} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlist.videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={{
              ...video,
              isCompleted: false, // This would come from user progress in real app
              isBookmarked: false, // This would come from user bookmarks
            }}
            onPlay={() => {
              // Store playlist in localStorage and use parent handler
              localStorage.setItem('neuro_playlist', JSON.stringify(playlist));
              onVideoPlay(video.id);
            }}
            onBookmark={(videoId) => {
              // Handle bookmarking logic here
              console.log('Bookmark video:', videoId);
            }}
          />
        ))}
      </div>
    </div>
  );
}