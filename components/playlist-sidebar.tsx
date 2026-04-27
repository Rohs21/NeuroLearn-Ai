'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, Shuffle, MoreVertical, PlayCircle } from 'lucide-react';

interface PlaylistSidebarProps {
  playlist: {
    title: string;
    description: string;
    totalVideos: number;
    completedVideos: number;
    videos: Array<{
      id: string;
      title: string;
      channelTitle: string;
      duration: string;
      thumbnailUrl: string;
      difficulty: string;
      order: number;
      isCompleted?: boolean;
    }>;
  };
  currentVideoId: string;
  onVideoSelect: (videoId: string) => void;
}

export function PlaylistSidebar({ playlist, currentVideoId, onVideoSelect }: PlaylistSidebarProps) {
  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden">
      
      {/* Playlist Header */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-white/10 shrink-0 bg-white/50 dark:bg-black/20">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight pr-4">{playlist.title}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4">
          <span className="flex items-center gap-1.5">
            <span className="text-zinc-900 dark:text-zinc-200">{playlist.completedVideos}</span> / {playlist.totalVideos} Videos
          </span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10">Updated today</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1 h-9 rounded-xl font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-md">
            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
            Play all
          </Button>
          <Button variant="outline" size="sm" className="h-9 w-10 p-0 rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300">
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Video List - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {playlist.videos.map((video, index) => {
          const isCurrentVideo = currentVideoId === video.id;
          
          return (
            <div
              key={video.id}
              className={`group flex items-center gap-3 p-3 mx-2 my-1 rounded-2xl cursor-pointer transition-all duration-300 ${
                isCurrentVideo
                  ? 'bg-zinc-100/80 dark:bg-white/10 shadow-sm border border-zinc-200/50 dark:border-white/5'
                  : 'hover:bg-zinc-50 dark:hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => onVideoSelect(video.id)}
            >
              {/* Video Index/Play Icon */}
              <div className="flex-shrink-0 w-6 flex items-center justify-center">
                {isCurrentVideo ? (
                  <PlayCircle className="h-4 w-4 text-primary fill-primary/20 animate-pulse" />
                ) : (
                  <span className="text-xs text-zinc-400 font-semibold group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{index + 1}</span>
                )}
              </div>

              {/* Thumbnail */}
              <div className="flex-shrink-0 relative rounded-lg overflow-hidden shadow-sm">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-[72px] h-[40px] object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                {/* Duration Badge */}
                <div className="absolute bottom-0.5 right-0.5 bg-black/70 backdrop-blur-md text-white/90 px-1 py-0.5 rounded-[4px] text-[9px] font-medium border border-white/10">
                  {video.duration}
                </div>
                {video.isCompleted && (
                  <div className="absolute top-0.5 left-0.5 bg-emerald-500 rounded-full p-0.5 shadow-sm border border-white/20">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className={`text-[13px] font-semibold leading-snug mb-1 line-clamp-2 transition-colors ${
                  isCurrentVideo ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'
                }`}>
                  {video.title}
                </h4>
                
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate pr-2">{video.channelTitle}</p>
                  {isCurrentVideo ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <Badge variant="outline" className={`shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md font-semibold border backdrop-blur-md ${getDifficultyStyles(video.difficulty)}`}>
                      {video.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="p-5 border-t border-zinc-200 dark:border-white/10 shrink-0 bg-white/50 dark:bg-black/20">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2.5">
          <span className="uppercase tracking-wider">Path Progress</span>
          <span>{Math.round((playlist.completedVideos / playlist.totalVideos) * 100)}%</span>
        </div>
        <div className="w-full bg-zinc-200/50 dark:bg-white/10 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-white/5">
          <div 
            className="bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(playlist.completedVideos / playlist.totalVideos) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}