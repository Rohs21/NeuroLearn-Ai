'use client';

import { useState } from 'react';
import { Play, Clock, BookOpen, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted" onClick={() => onPlay(video.id)}>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </div>
          )}
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {video.duration}
          </div>

          {/* Difficulty badge */}
          <Badge className={`absolute top-2 left-2 text-xs ${getDifficultyColor(video.difficulty)}`}>
            <BookOpen className="h-3 w-3 mr-1" />
            {video.difficulty}
          </Badge>

          {/* Completion indicator */}
          {video.isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <Play className="h-3 w-3" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-muted-foreground text-xs mb-3">{video.channelTitle}</p>
          
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPlay(video.id);
              }}
              className="text-xs"
            >
              Watch Now
            </Button>
            
            {onBookmark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(video.id);
                  setClick(true);
                  }}
                className={`p-2 ${click ? "bg-black text-white" : ""}`}
              >
                <Star className={`h-4 w-4 ${video.isBookmarked ? 'fill-current text-yellow-500' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}