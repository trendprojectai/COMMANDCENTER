import type { InsightItem } from '../../lib/analyticsTypes';

interface InsightsPanelProps {
  insights: InsightItem[];
}

const toneMap: Record<InsightItem['level'], string> = {
  info: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">Insights</h3>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={`${insight.level}-${index}`} className={`rounded-md border px-3 py-2 text-sm ${toneMap[insight.level]}`}>
            {insight.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
