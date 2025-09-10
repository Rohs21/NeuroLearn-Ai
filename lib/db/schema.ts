import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const playlists = pgTable('playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  query: text('query').notNull(),
  language: text('language').default('en'),
  difficulty: text('difficulty').default('beginner'),
  totalVideos: integer('total_videos').default(0),
  completedVideos: integer('completed_videos').default(0),
  isBookmarked: boolean('is_bookmarked').default(false),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  playlistId: uuid('playlist_id').references(() => playlists.id),
  youtubeId: text('youtube_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  channelTitle: text('channel_title'),
  duration: text('duration'),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: timestamp('published_at'),
  difficulty: text('difficulty').default('beginner'),
  order: integer('order').notNull(),
  aiSummary: text('ai_summary'),
  quiz: jsonb('quiz').default([]),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProgress = pgTable('user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  videoId: uuid('video_id').references(() => videos.id),
  playlistId: uuid('playlist_id').references(() => playlists.id),
  isCompleted: boolean('is_completed').default(false),
  isBookmarked: boolean('is_bookmarked').default(false),
  watchTime: integer('watch_time').default(0),
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const searchHistory = pgTable('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  query: text('query').notNull(),
  language: text('language'),
  difficulty: text('difficulty'),
  resultsCount: integer('results_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  playlists: many(playlists),
  progress: many(userProgress),
  searchHistory: many(searchHistory),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  videos: many(videos),
  progress: many(userProgress),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  playlist: one(playlists, {
    fields: [videos.playlistId],
    references: [playlists.id],
  }),
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [userProgress.videoId],
    references: [videos.id],
  }),
  playlist: one(playlists, {
    fields: [userProgress.playlistId],
    references: [playlists.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));