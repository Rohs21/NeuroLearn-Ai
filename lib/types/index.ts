export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  duration: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  query: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalVideos: number;
  completedVideos: number;
  isBookmarked: boolean;
  videos: PlaylistVideo[];
  createdAt: string;
}

export interface PlaylistVideo extends YouTubeVideo {
  order: number;
  difficulty: string;
  aiSummary?: string;
  quiz?: QuizQuestion[];
  isCompleted?: boolean;
  isBookmarked?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultLanguage: string;
  defaultDifficulty: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  language?: string;
  difficulty?: string;
  resultsCount: number;
  createdAt: string;
}