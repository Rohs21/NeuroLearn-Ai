'use client';

import { useEffect, useState } from 'react';
import { PlaylistGrid } from '@/components/playlist-grid';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Navbar } from '@/components/navbar';

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
      <Navbar showBackButton={true} showAuthButtons={true} isAuthenticated={false} />

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