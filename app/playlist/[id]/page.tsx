'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PlaylistGrid } from '@/components/playlist-grid';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Navbar } from '@/components/navbar';

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { status: sessionStatus } = useSession();

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
    if (playlist) {
      // Store full playlist with DB id so watch page can update progress
      localStorage.setItem('neuro_playlist', JSON.stringify({
        ...playlist.videos,
        _playlistId: params.id,
      }));
    }
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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] relative z-10 overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-70" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] opacity-50" />

      <Navbar />

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