import type { TopContentItem } from '../../lib/analyticsTypes';

export type SortMetric = 'views' | 'likes' | 'comments' | 'shares';

interface TopContentTableProps {
  rows: TopContentItem[];
  sortMetric: SortMetric;
  onSortMetricChange: (metric: SortMetric) => void;
}

const SORT_OPTIONS: SortMetric[] = ['views', 'likes', 'comments', 'shares'];

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

const platformTone: Record<TopContentItem['platform'], string> = {
  tiktok: 'bg-[#111827] text-cyan-300 border border-cyan-500/30',
  instagram: 'bg-[#1f1233] text-pink-300 border border-pink-500/30',
  youtube: 'bg-[#2a1010] text-red-300 border border-red-500/30',
};

const platformLabel: Record<TopContentItem['platform'], string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export function TopContentTable({ rows, sortMetric, onSortMetricChange }: TopContentTableProps) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Top Content</h3>
        <div className="inline-flex rounded-full border border-border bg-bg p-1">
          {SORT_OPTIONS.map((metric) => (
            <button
              key={metric}
              type="button"
              onClick={() => onSortMetricChange(metric)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                sortMetric === metric
                  ? 'bg-accent text-bg'
                  : 'text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-text-muted">
              <th className="pb-2">Platform</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Views</th>
              <th className="pb-2">Likes</th>
              <th className="pb-2">Comments</th>
              <th className="pb-2">Shares</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-border/80 text-text-primary">
                <td className="py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${platformTone[item.platform]}`}>
                    {platformLabel[item.platform]}
                  </span>
                </td>
                <td className="py-3 pr-3">{item.title}</td>
                <td className="py-3 text-text-muted">{item.postedAt}</td>
                <td className="py-3">{formatNumber(item.views)}</td>
                <td className="py-3">{formatNumber(item.likes)}</td>
                <td className="py-3">{formatNumber(item.comments)}</td>
                <td className="py-3">{formatNumber(item.shares)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
