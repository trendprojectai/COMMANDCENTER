import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartPoint {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  growth: number;
}

type ChartMetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'growth';

interface MetricChartProps {
  data: ChartPoint[];
  previousData?: ChartPoint[];
  enabledMetrics: ChartMetricKey[];
  compareOn: boolean;
  compareMetric: ChartMetricKey;
}

const METRIC_META: Record<ChartMetricKey, { label: string; color: string }> = {
  views: { label: 'Views', color: '#8B5CF6' },
  likes: { label: 'Likes', color: '#F5A623' },
  comments: { label: 'Comments', color: '#22D3EE' },
  shares: { label: 'Shares', color: '#34D399' },
  growth: { label: 'Followers/Subs', color: '#F97316' },
};

export function MetricChart({
  data,
  previousData,
  enabledMetrics,
  compareOn,
  compareMetric,
}: MetricChartProps) {
  const merged = data.map((point, index) => ({
    ...point,
    previousMetric: previousData?.[index]?.[compareMetric] ?? null,
  }));

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Performance over time</h3>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 10, right: 24, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="#1E1E2E" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#8888AA" tick={{ fill: '#8888AA', fontSize: 12 }} />
            <YAxis stroke="#8888AA" tick={{ fill: '#8888AA', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121A',
                border: '1px solid #1E1E2E',
                borderRadius: '12px',
                color: '#F0F0F0',
              }}
            />
            <Legend wrapperStyle={{ color: '#F0F0F0', fontSize: '12px' }} />

            {compareOn ? (
              <Line
                key="previous-metric"
                dataKey="previousMetric"
                name={`Previous ${METRIC_META[compareMetric].label}`}
                stroke={METRIC_META[compareMetric].color}
                strokeOpacity={0.35}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                strokeWidth={2}
              />
            ) : null}

            {enabledMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={METRIC_META[metric].label}
                stroke={METRIC_META[metric].color}
                dot={false}
                strokeWidth={2.5}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
