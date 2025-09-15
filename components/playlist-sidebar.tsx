'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Clock, BookOpen, CheckCircle2, Shuffle, Repeat, MoreVertical, PlayCircle } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const currentVideoIndex = playlist.videos.findIndex(video => video.id === currentVideoId);

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Playlist Header - YouTube Style */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-900 truncate flex-1">{playlist.title}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>{playlist.completedVideos} / {playlist.totalVideos}</span>
          <span className="text-xs">Updated today</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs">
            <Play className="h-3 w-3 mr-1" />
            Play all
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Shuffle className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Video List - Scrollable */}
      <div className="max-h-96 overflow-y-auto">
        {playlist.videos.map((video, index) => {
          const isCurrentVideo = currentVideoId === video.id;
          
          return (
            <div
              key={video.id}
              className={`flex items-center gap-3 p-2 cursor-pointer transition-colors hover:bg-gray-50 border-l-2 ${
                isCurrentVideo
                  ? 'bg-blue-50 border-l-blue-500'
                  : 'border-l-transparent'
              }`}
              onClick={() => onVideoSelect(video.id)}
            >
              {/* Video Index/Play Icon */}
              <div className="flex-shrink-0 w-6 flex items-center justify-center">
                {isCurrentVideo ? (
                  <PlayCircle className="h-4 w-4 text-blue-600 fill-current" />
                ) : (
                  <span className="text-xs text-gray-500 font-medium">{index + 1}</span>
                )}
              </div>

              {/* Thumbnail */}
              <div className="flex-shrink-0 relative">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-16 h-9 object-cover rounded"
                />
                {/* Duration Badge */}
                <div className="absolute bottom-0.5 right-0.5 bg-black bg-opacity-80 text-white px-1 py-0.5 rounded text-xs font-medium">
                  {video.duration}
                </div>
                {video.isCompleted && (
                  <div className="absolute top-0.5 left-0.5 bg-green-500 rounded-full p-0.5">
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium leading-tight mb-1 line-clamp-2 ${
                  isCurrentVideo ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {video.title}
                </h4>
                <p className="text-xs text-gray-500 mb-1">{video.channelTitle}</p>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0.5 h-5 ${getDifficultyColor(video.difficulty)}`}
                  >
                    {video.difficulty}
                  </Badge>
                  {isCurrentVideo && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round((playlist.completedVideos / playlist.totalVideos) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(playlist.completedVideos / playlist.totalVideos) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}