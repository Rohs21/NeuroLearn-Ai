'use client';

import { useEffect, useState } from 'react';
import { PlaylistGrid } from '@/components/playlist-grid';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const response = await fetch(`/api/playlist/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Playlist not found');
          }
          throw new Error('Failed to load playlist');
        }
        const data = await response.json();
        setPlaylist(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylist();
  }, [params.id]);

  const handleVideoPlay = (videoId: string) => {
    router.push(`/watch?v=${videoId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-8">{error || 'Failed to load playlist'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">NeuroLearn-AI</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="default" size="sm" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* <h1 className="text-2xl font-bold mb-4">{playlist.title}</h1>
        {playlist.description && (
          <p className="text-muted-foreground mb-8">{playlist.description}</p>
        )} */}
        <PlaylistGrid 
          playlist={playlist.videos}
          onVideoPlay={handleVideoPlay}
        />
      </main>
    </div>
  );
}