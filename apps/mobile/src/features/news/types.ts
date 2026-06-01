export interface FeedItem {
  id: string;
  source: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  freshness: string;
  priority: 'Top Story' | 'For You' | 'Deep Dive' | 'Quick Read';
}
