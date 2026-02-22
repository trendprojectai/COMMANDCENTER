export type AnalyticsPlatform = 'all' | 'tiktok' | 'instagram' | 'youtube';

export type AnalyticsRange = '24h' | '7d' | '28d' | '90d' | 'custom';

export type AnalyticsMetricKey =
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'followers'
  | 'subs'
  | 'growth';

export type InsightLevel = 'info' | 'success' | 'warn';

export interface MetricTotal {
  value: number;
  deltaPct?: number;
}

export interface AnalyticsTotals {
  views: MetricTotal;
  likes: MetricTotal;
  comments: MetricTotal;
  shares: MetricTotal;
  followers: MetricTotal;
  subs: MetricTotal;
}

export interface PlatformTotals {
  tiktok: { views: number; followers: number };
  instagram: { views: number; followers: number };
  youtube: { views: number; subs: number };
}

export interface TimeseriesPoint {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  subs: number;
  platform?: { tiktok: number; instagram: number; youtube: number };
}

export interface TopContentItem {
  id: string;
  platform: Exclude<AnalyticsPlatform, 'all'>;
  title: string;
  postedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface InsightItem {
  level: InsightLevel;
  text: string;
}

export interface AnalyticsResponse {
  account: string;
  platform: AnalyticsPlatform;
  range: AnalyticsRange;
  totals: AnalyticsTotals;
  platformTotals: PlatformTotals;
  timeseries: TimeseriesPoint[];
  previousTimeseries?: TimeseriesPoint[];
  topContent: TopContentItem[];
  insights: InsightItem[];
}
