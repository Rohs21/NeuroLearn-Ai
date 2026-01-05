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
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 bg-card border rounded-lg shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to learn?"
              className="pl-10 h-11 sm:h-12 text-sm sm:text-base border-0 bg-background/50"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-24 sm:w-32 h-11 sm:h-12 border-0 bg-background/50 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-28 sm:w-36 h-11 sm:h-12 border-0 bg-background/50 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              type="submit" 
              size="lg" 
              className="h-11 sm:h-12 px-4 sm:px-8 text-sm sm:text-base"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="hidden sm:inline">Search</span>
              )}
              {!isLoading && <Search className="h-4 w-4 sm:hidden" />}
            </Button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 justify-center">
        {popularQueries.map((popularQuery) => (
          <Button
            key={popularQuery}
            size="sm"
            onClick={() => {
              setQuery(popularQuery);
              onSearch(popularQuery, language, difficulty);
            }}
            className={
              "text-xs text-black/90 dark:text-white rounded-full px-3 py-1 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 dark:bg-transparent dark:border-border"
            }
            disabled={isLoading}
          >
            {popularQuery}
          </Button>
        ))}
      </div>
    </div>
  );
}