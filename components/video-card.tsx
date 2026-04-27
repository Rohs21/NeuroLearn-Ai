'use client';

import { useState } from 'react';
import { Play, Clock, BookOpen, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    channelTitle: string;
    duration: string;
    thumbnailUrl: string;
    difficulty: string;
    isCompleted?: boolean;
    isBookmarked?: boolean;
  };
  onPlay: (videoId: string) => void;
  onBookmark?: (videoId: string) => void;
}

export function VideoCard({ video, onPlay, onBookmark }: VideoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [click, setClick] = useState(false);

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div 
      className="group flex flex-col h-full bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_30px_-12px_rgba(255,255,255,0.1)] transition-all duration-500 hover:-translate-y-1 cursor-pointer"
      onClick={() => onPlay(video.id)}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-r-transparent" />
          </div>
        )}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-2xl">
            <Play className="h-6 w-6 text-white ml-1 fill-white" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border backdrop-blur-md ${getDifficultyStyles(video.difficulty)}`}>
            {video.difficulty}
          </Badge>

          {video.isCompleted && (
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 rounded-full p-1.5 shadow-sm">
              <Play className="h-3 w-3 fill-current" />
            </div>
          )}
        </div>

        {/* Bottom Stats */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white/90 px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 border border-white/10">
          <Clock className="h-3 w-3 opacity-70" />
          {video.duration}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 font-medium">
            {video.channelTitle}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
          <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" /> Watch Now
          </span>
          
          {onBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(video.id);
                setClick(!click);
              }}
              className={`p-1.5 rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-white/10 ${click ? "text-yellow-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
            >
              <Star className={`h-4 w-4 ${video.isBookmarked || click ? 'fill-current text-yellow-500' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}