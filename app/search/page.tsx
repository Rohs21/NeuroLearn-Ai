import React from 'react';
import { Suspense } from 'react';
import SearchResultsClient from '@/components/search-results-client';

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center">Loading search results...</div>}>
      <SearchResultsClient />
    </Suspense>
  );
}
