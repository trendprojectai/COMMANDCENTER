import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { KpiCard } from '../components/analytics/KpiCard';
import { PlatformMiniCard } from '../components/analytics/PlatformMiniCard';
import { MetricChart } from '../components/analytics/MetricChart';
import { TopContentTable, type SortMetric } from '../components/analytics/TopContentTable';
import { PlatformBreakdown } from '../components/analytics/PlatformBreakdown';
import { InsightsPanel } from '../components/analytics/InsightsPanel';
import type { AnalyticsPlatform, AnalyticsRange, AnalyticsResponse } from '../lib/analyticsTypes';

const ACCOUNTS = ['9to5doggo', 'dailydoggo'];
const PLATFORMS: AnalyticsPlatform[] = ['all', 'tiktok', 'instagram', 'youtube'];
const RANGES: AnalyticsRange[] = ['24h', '7d', '28d', '90d', 'custom'];
type ChartMetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'growth';

const CHART_TOGGLES: Array<{ key: ChartMetricKey; label: string }> = [
  { key: 'views', label: 'Views' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
  { key: 'growth', label: 'Followers/Subs' },
];

const rangeLabel = (range: AnalyticsRange): string => {
  if (range === '24h') return 'vs prior 24h';
  if (range === '7d') return 'vs prior 7d';
  if (range === '28d') return 'vs prior 28d';
  if (range === '90d') return 'vs prior 90d';
  return 'vs prior custom range';
};

const platformLabel = (platform: AnalyticsPlatform): string => {
  if (platform === 'all') return 'All';
  if (platform === 'tiktok') return 'TikTok';
  if (platform === 'instagram') return 'Instagram';
  return 'YouTube';
};

export function Dashboard() {
  const [account, setAccount] = useState('9to5doggo');
  const [platform, setPlatform] = useState<AnalyticsPlatform>('all');
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const [compare, setCompare] = useState(true);
  const [sortMetric, setSortMetric] = useState<SortMetric>('views');
  const [enabledMetrics, setEnabledMetrics] = useState<ChartMetricKey[]>(['views']);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        account,
        platform,
        range,
        compare: compare ? 'true' : 'false',
      });
      const response = await fetch(`/api/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics (${response.status})`);
      }
      const payload = (await response.json()) as AnalyticsResponse;
      setData(payload);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [account, platform, range, compare]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.timeseries.map((point) => ({
      date: point.date,
      views: point.views,
      likes: point.likes,
      comments: point.comments,
      shares: point.shares,
      growth: platform === 'youtube' ? point.subs : point.followers + point.subs,
    }));
  }, [data, platform]);

  const previousChartData = useMemo(() => {
    if (!data?.previousTimeseries) return undefined;
    return data.previousTimeseries.map((point) => ({
      date: point.date,
      views: point.views,
      likes: point.likes,
      comments: point.comments,
      shares: point.shares,
      growth: platform === 'youtube' ? point.subs : point.followers + point.subs,
    }));
  }, [data, platform]);

  const sortedTopContent = useMemo(() => {
    if (!data) return [];
    return [...data.topContent].sort((a, b) => b[sortMetric] - a[sortMetric]);
  }, [data, sortMetric]);

  const compareMetric: ChartMetricKey = enabledMetrics[0] ?? 'views';

  const toggleMetric = (metric: ChartMetricKey) => {
    setEnabledMetrics((current) => {
      if (current.includes(metric)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== metric);
      }
      return [...current, metric];
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Cross-platform performance for social content</p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary transition hover:border-accent disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
        <label className="inline-flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 text-sm text-text-primary">
          <span className="text-xs uppercase tracking-wider text-text-muted">Account</span>
          <select
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            className="bg-transparent text-sm outline-none"
          >
            {ACCOUNTS.map((item) => (
              <option key={item} value={item} className="bg-surface text-text-primary">
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex rounded-full border border-border bg-surface p-1">
          {PLATFORMS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlatform(item)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                platform === item ? 'bg-accent text-bg' : 'text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {platformLabel(item)}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-full border border-border bg-surface p-1">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                range === item ? 'bg-accent text-bg' : 'text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCompare((current) => !current)}
          className={[
            'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
            compare
              ? 'border-accent/50 bg-accent/20 text-accent'
              : 'border-border bg-surface text-text-muted',
          ].join(' ')}
        >
          Compare {compare ? 'On' : 'Off'}
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-failed">{error}</p> : null}

      {!data ? (
        <div className="rounded-card border border-border bg-surface px-4 py-6 text-sm text-text-muted">
          {loading ? 'Loading analytics...' : 'No analytics data available.'}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              title="Views"
              value={data.totals.views.value}
              deltaPct={data.totals.views.deltaPct}
              compareOn={compare}
              priorLabel={rangeLabel(range)}
            />
            <KpiCard
              title="Likes"
              value={data.totals.likes.value}
              deltaPct={data.totals.likes.deltaPct}
              compareOn={compare}
              priorLabel={rangeLabel(range)}
            />
            <KpiCard
              title="Comments"
              value={data.totals.comments.value}
              deltaPct={data.totals.comments.deltaPct}
              compareOn={compare}
              priorLabel={rangeLabel(range)}
            />
            <KpiCard
              title="Shares"
              value={data.totals.shares.value}
              deltaPct={data.totals.shares.deltaPct}
              compareOn={compare}
              priorLabel={rangeLabel(range)}
            />
            <KpiCard
              title="Followers gained"
              value={data.totals.followers.value}
              deltaPct={data.totals.followers.deltaPct}
              compareOn={compare}
              priorLabel={rangeLabel(range)}
            />
            <KpiCard
              title="Subs gained"
              value={data.totals.subs.value}
              deltaPct={data.totals.subs.deltaPct}
              compareOn={compare}
              priorLabel={rangeLabel(range)}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <PlatformMiniCard
              platform="tiktok"
              views={data.platformTotals.tiktok.views}
              growth={data.platformTotals.tiktok.followers}
              growthLabel="followers gained"
              selectedPlatform={platform}
            />
            <PlatformMiniCard
              platform="instagram"
              views={data.platformTotals.instagram.views}
              growth={data.platformTotals.instagram.followers}
              growthLabel="followers gained"
              selectedPlatform={platform}
            />
            <PlatformMiniCard
              platform="youtube"
              views={data.platformTotals.youtube.views}
              growth={data.platformTotals.youtube.subs}
              growthLabel="subs gained"
              selectedPlatform={platform}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="rounded-card border border-border bg-surface px-4 py-4">
                <div className="mb-4 inline-flex flex-wrap gap-2">
                  {CHART_TOGGLES.map((item) => {
                    const active = enabledMetrics.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleMetric(item.key)}
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'border-accent/60 bg-accent/20 text-accent'
                            : 'border-border text-text-muted hover:text-text-primary',
                        ].join(' ')}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <MetricChart
                  data={chartData}
                  previousData={previousChartData}
                  enabledMetrics={enabledMetrics}
                  compareOn={compare}
                  compareMetric={compareMetric}
                />
              </div>

              <PlatformBreakdown platform={platform} timeseries={data.timeseries} />
            </div>

            <InsightsPanel insights={data.insights} />
          </section>

          <TopContentTable
            rows={sortedTopContent}
            sortMetric={sortMetric}
            onSortMetricChange={setSortMetric}
          />
        </div>
      )}
    </div>
  );
}
