'use client';

import { useRouter } from "next/navigation";
import { VideoCard } from './video-card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Star, Sparkles } from 'lucide-react';
import { AddInterview } from '@/app/dashboard/_components/AddInterview';

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

  const router = useRouter();
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Playlist Header Card */}
      <div className="relative overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl p-8 sm:p-10">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 dark:bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white text-xs font-semibold tracking-wide uppercase">
                AI Curated Path
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {playlist.title}
            </h1>
            
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
              {playlist.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <BookOpen className="h-4 w-4 text-primary dark:text-white" />
                {playlist.totalVideos} Videos
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <Clock className="h-4 w-4 text-primary dark:text-white" />
                ~{Math.round(playlist.totalVideos * 15)} Min Total
              </div>
            </div>
          </div>

          <div className="flex flex-row flex-wrap lg:flex-col gap-3 lg:min-w-[200px]">
            <AddInterview 
              variant="custom"
              initialData={{
                jobPosition: playlist.title,
                jobDesc: playlist.description,
                jobExperience: "1"
              }}
              customTrigger={
                <Button 
                  size="lg"
                  className="flex-1 lg:w-full rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 border-0 h-12 transition-all font-medium"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mock Interview
                </Button>
              }
            />
            
            {onBookmarkPlaylist && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={onBookmarkPlaylist}
                className="flex-1 lg:w-full rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all h-12 text-zinc-700 dark:text-zinc-300 bg-transparent"
              >
                <Star className="h-4 w-4 mr-2" />
                Bookmark Path
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar Section */}
        {playlist.completedVideos > 0 && (
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-white/10">
            <div className="flex justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
              <span>Your Progress</span>
              <span>{Math.round(progressPercentage)}% ({playlist.completedVideos}/{playlist.totalVideos})</span>
            </div>
            <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10">
              <div 
                className="h-full bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlist.videos.map((video, index) => (
          <div 
            key={video.id} 
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
          >
            <VideoCard
              video={{
                ...video,
                isCompleted: false, // This would come from user progress in real app
                isBookmarked: false, // This would come from user bookmarks
              }}
              onPlay={() => {
                localStorage.setItem('neuro_playlist', JSON.stringify(playlist));
                onVideoPlay(video.id);
              }}
              onBookmark={(videoId) => {
                console.log('Bookmark video:', videoId);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}