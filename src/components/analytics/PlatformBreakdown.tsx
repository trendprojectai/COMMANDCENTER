import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsPlatform, TimeseriesPoint } from '../../lib/analyticsTypes';

interface PlatformBreakdownProps {
  platform: AnalyticsPlatform;
  timeseries: TimeseriesPoint[];
}

export function PlatformBreakdown({ platform, timeseries }: PlatformBreakdownProps) {
  const isAll = platform === 'all';
  const platformSeries = timeseries.map((item) => ({
    date: item.date,
    tiktok: item.platform?.tiktok ?? 0,
    instagram: item.platform?.instagram ?? 0,
    youtube: item.platform?.youtube ?? 0,
    views: item.views,
  }));

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">Platform breakdown</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {isAll ? (
            <BarChart data={platformSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1E1E2E" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#8888AA" tick={{ fill: '#8888AA', fontSize: 12 }} />
              <YAxis stroke="#8888AA" tick={{ fill: '#8888AA', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121A',
                  border: '1px solid #1E1E2E',
                  borderRadius: '12px',
                }}
              />
              <Legend wrapperStyle={{ color: '#F0F0F0', fontSize: '12px' }} />
              <Bar dataKey="tiktok" stackId="views" fill="#22D3EE" name="TikTok" />
              <Bar dataKey="instagram" stackId="views" fill="#F472B6" name="Instagram" />
              <Bar dataKey="youtube" stackId="views" fill="#F97316" name="YouTube" />
            </BarChart>
          ) : (
            <LineChart data={platformSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1E1E2E" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#8888AA" tick={{ fill: '#8888AA', fontSize: 12 }} />
              <YAxis stroke="#8888AA" tick={{ fill: '#8888AA', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121A',
                  border: '1px solid #1E1E2E',
                  borderRadius: '12px',
                }}
              />
              <Legend wrapperStyle={{ color: '#F0F0F0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="views" name="Views" stroke="#8B5CF6" dot={false} strokeWidth={2.5} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
