'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchBarProps {
  onSearch: (query: string, language: string, difficulty: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [difficulty, setDifficulty] = useState('beginner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), language, difficulty);
    }
  };

  const popularQueries = [
    'React.js tutorial',
    'Python for beginners',
    'Machine Learning basics',
    'Web development',
    'JavaScript fundamentals',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="relative group">
        
        {/* Animated glow effect behind the search bar */}
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-white/10 dark:via-white/5 dark:to-white/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
        
        <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-0 p-2 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-[1.5rem] shadow-xl dark:shadow-[0_0_30px_-15px_rgba(255,255,255,0.05)] transition-all">
          
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to learn?"
              className="w-full pl-12 pr-4 h-14 text-base sm:text-lg border-0 bg-transparent shadow-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none !ring-0 !outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="hidden sm:block w-px h-8 bg-zinc-200 dark:bg-white/10 my-auto mx-2" />

          <div className="flex items-center gap-2 px-2 pb-2 sm:p-0 sm:pr-1">
            
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[110px] h-12 border-0 bg-transparent shadow-none hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl text-sm font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-zinc-200 dark:border-white/10 shadow-xl">
                <SelectItem value="en" className="rounded-lg">English</SelectItem>
                <SelectItem value="hi" className="rounded-lg">Hindi</SelectItem>
                <SelectItem value="es" className="rounded-lg">Spanish</SelectItem>
                <SelectItem value="fr" className="rounded-lg">French</SelectItem>
                <SelectItem value="de" className="rounded-lg">German</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-[130px] h-12 border-0 bg-transparent shadow-none hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl text-sm font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-zinc-200 dark:border-white/10 shadow-xl">
                <SelectItem value="beginner" className="rounded-lg">Beginner</SelectItem>
                <SelectItem value="intermediate" className="rounded-lg">Intermediate</SelectItem>
                <SelectItem value="advanced" className="rounded-lg">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              type="submit" 
              size="lg" 
              className="h-12 ml-1 px-6 sm:px-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="hidden sm:inline">Search</span>
              )}
              {!isLoading && <Search className="h-4 w-4 sm:hidden" />}
            </Button>
          </div>

        </div>
      </form>

      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {popularQueries.map((popularQuery) => (
          <button
            key={popularQuery}
            onClick={() => {
              setQuery(popularQuery);
              onSearch(popularQuery, language, difficulty);
            }}
            disabled={isLoading}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-[0.98]"
          >
            {popularQuery}
          </button>
        ))}
      </div>
    </div>
  );
}