'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Clock, BookOpen, CheckCircle2 } from 'lucide-react';

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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto scrollbar-hide">
      {/* Playlist Header */}
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="font-bold text-lg mb-2 line-clamp-2">{playlist.title}</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{playlist.totalVideos} videos</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{playlist.completedVideos} completed</span>
          </div>
        </div>
      </div>

  {/* Video List - Remove ScrollArea since parent handles scrolling */}
  <div className="flex-1">
        <div className="p-2">
          {playlist.videos.map((video, index) => (
            <div
              key={video.id}
              className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                currentVideoId === video.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onVideoSelect(video.id)}
            >
              {/* Video Number */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {currentVideoId === video.id ? (
                  <Play className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Thumbnail */}
              <div className="flex-shrink-0 relative">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-20 h-12 object-cover rounded"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1 py-0.5 rounded text-xs flex items-center gap-1">
                  <Clock className="h-2 w-2" />
                  {video.duration}
                </div>
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium line-clamp-2 mb-1 ${
                  currentVideoId === video.id ? 'text-primary' : ''
                }`}>
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{video.channelTitle}</p>
                
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getDifficultyColor(video.difficulty)}`}>
                    {video.difficulty}
                  </Badge>
                  {video.isCompleted && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Example usage with sample data for demonstration
function PlaylistDemo() {
  const [currentVideoId, setCurrentVideoId] = useState('1');
  
  const samplePlaylist = {
    title: "React Advanced Patterns",
    description: "Learn advanced React patterns and techniques",
    totalVideos: 15,
    completedVideos: 3,
    videos: Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      title: `React Pattern ${i + 1}: Advanced Techniques for Modern Development`,
      channelTitle: "React Mastery",
      duration: `${Math.floor(Math.random() * 20) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      thumbnailUrl: `https://picsum.photos/120/68?random=${i + 1}`,
      difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
      order: i + 1,
      isCompleted: Math.random() > 0.7
    }))
  };

  return (
    <div className="h-screen flex">
      {/* Main content area */}
      <div className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Video Player Area</h1>
        <div className="bg-black aspect-video rounded-lg flex items-center justify-center">
          <p className="text-white">Currently playing video {currentVideoId}</p>
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Video Title</h2>
          <p className="text-gray-600 mt-2">Video description and content would go here...</p>
        </div>
      </div>
      
      {/* Sidebar - Fixed height is crucial */}
      <div className="w-96 bg-white border-l h-screen">
        <PlaylistSidebar
          playlist={samplePlaylist}
          currentVideoId={currentVideoId}
          onVideoSelect={setCurrentVideoId}
        />
      </div>
    </div>
  );
}

export default PlaylistDemo;