interface KpiCardProps {
  title: string;
  value: number;
  deltaPct?: number;
  compareOn: boolean;
  priorLabel: string;
}

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

export function KpiCard({ title, value, deltaPct, compareOn, priorLabel }: KpiCardProps) {
  const isUp = (deltaPct ?? 0) >= 0;

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-4">
      <p className="text-xs uppercase tracking-wider text-text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{formatNumber(value)}</p>
      {compareOn ? (
        <div className="mt-3">
          <p className={`text-sm font-medium ${isUp ? 'text-success' : 'text-failed'}`}>
            {isUp ? '+' : ''}
            {deltaPct?.toFixed(1) ?? '0.0'}%
          </p>
          <p className="text-xs text-text-muted">{priorLabel}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-muted">Comparison disabled</p>
      )}
    </div>
  );
}
