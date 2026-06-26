"use client";

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LearningRoadmapView } from '@/components/learning-roadmap';
import { PlaylistGrid } from '@/components/playlist-grid';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';

// Module-level cache: lives as long as the browser tab is open.
// Only populated on success — failed or empty results are NEVER stored here.
const successCache = new Map<string, { playlist?: any; document?: any }>();

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams?.get('query') || '';
  const language = searchParams?.get('language') || 'en';
  const difficulty = searchParams?.get('difficulty') || 'beginner';
  const outputType = (searchParams?.get('outputType') as 'playlist' | 'document') || 'playlist';

  const cacheKey = `${query}||${language}||${difficulty}||${outputType}`;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [playlist, setPlaylist] = useState<any>(null);
  const [documentRoadmap, setDocumentRoadmap] = useState<any>(null);

  // Tracks the last cacheKey we successfully fetched so we know when to trigger a fresh fetch
  const lastFetchedKey = useRef<string | null>(null);
  // Retry counter — incrementing it forces a re-fetch for the same query
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!query) return;

    // If we already have a successful result cached AND this isn't a manual retry, restore it immediately.
    const cached = successCache.get(cacheKey);
    if (cached && lastFetchedKey.current === cacheKey) {
      if (outputType === 'document' && cached.document) {
        setDocumentRoadmap(cached.document);
        setError('');
        return;
      }
      if (outputType === 'playlist' && cached.playlist) {
        setPlaylist(cached.playlist);
        setError('');
        return;
      }
    }

    const doSearch = async () => {
      setIsLoading(true);
      setError('');
      // ✅ Do NOT clear existing document/playlist here — preserve the last good data
      // while the new fetch is in-flight so the user always sees something.

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query, language, difficulty, outputType }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');

        if (outputType === 'document') {
          if (data.document) {
            setDocumentRoadmap(data.document);
            setPlaylist(null);
            // ✅ Only write to cache when we actually have content
            successCache.set(cacheKey, { document: data.document });
            lastFetchedKey.current = cacheKey;
          } else {
            setError('Document could not be generated. Please try again.');
          }
        } else if (outputType === 'playlist' && data.playlist) {
          // ✅ Cache before redirecting so back-navigation restores it instantly
          successCache.set(cacheKey, { playlist: data.playlist });
          lastFetchedKey.current = cacheKey;
          try {
            const saveRes = await fetch('/api/playlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                title: `Learning Path: ${query}`,
                description: `AI-curated learning path for ${query} (${language}, ${difficulty})`,
                videos: data.playlist,
              }),
            });
            if (saveRes.ok) {
              const saved = await saveRes.json();
              router.push(`/playlist/${saved.id}`);
              return;
            }
            setDocumentRoadmap(null);
            setPlaylist(data.playlist);
          } catch (e) {
            console.error('Failed to auto-save playlist', e);
            setDocumentRoadmap(null);
            setPlaylist(data.playlist);
          }
        } else {
          setError(data.message || 'No results found.');
        }
      } catch (err: any) {
        // ✅ On failure, keep whatever was already displayed — only set the error banner.
        // Previous document/playlist stays visible beneath the error.
        setError(err?.message || 'Failed to search. Please try again.');
        // ❌ Nothing written to cache on failure — next search re-fetches cleanly
      } finally {
        setIsLoading(false);
      }
    };

    doSearch();
  }, [query, language, difficulty, outputType, router, cacheKey, retryCount]);

  const handleRetry = () => {
    setError('');
    setRetryCount(c => c + 1);
  };

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      {!query && (
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">No search query</h2>
          <p className="mb-6 text-muted-foreground">Please enter a topic from the homepage search box.</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push('/')}>Back Home</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="relative z-10 container mx-auto px-4 min-h-[calc(100vh-65px)] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center p-10 sm:p-14 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500 max-w-lg w-full mx-auto">
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-zinc-400/20 dark:bg-white/10 blur-2xl rounded-full animate-pulse" />
              <div className="absolute inset-0 border-[3px] border-zinc-200 dark:border-white/10 rounded-full" />
              <div className="absolute inset-0 border-[3px] border-zinc-900 dark:border-white rounded-full border-t-transparent animate-spin duration-1000" />
              <svg className="h-8 w-8 text-zinc-900 dark:text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3 text-center">
              Curating Your Learning Path
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-sm text-sm sm:text-base leading-relaxed">
              Our AI is analyzing top content to build the perfect personalized curriculum for &ldquo;{query}&rdquo;...
            </p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="container mx-auto px-4 py-10 text-center">
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      )}

      {playlist && !isLoading && outputType === 'playlist' && (
        <div className="container mx-auto px-4 py-10">
          <PlaylistGrid playlist={playlist} onVideoPlay={(id: string) => router.push(`/watch?v=${id}`)} onBookmarkPlaylist={() => { }} />
        </div>
      )}

      {documentRoadmap && !isLoading && outputType === 'document' && (
        <div className="container mx-auto px-4 py-10">
          <LearningRoadmapView roadmap={documentRoadmap} />
        </div>
      )}
    </div>
  );
}
