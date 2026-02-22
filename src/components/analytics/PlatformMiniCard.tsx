import type { AnalyticsPlatform } from '../../lib/analyticsTypes';

interface PlatformMiniCardProps {
  platform: Exclude<AnalyticsPlatform, 'all'>;
  views: number;
  growth: number;
  growthLabel: string;
  selectedPlatform: AnalyticsPlatform;
}

const PLATFORM_LABELS: Record<Exclude<AnalyticsPlatform, 'all'>, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

export function PlatformMiniCard({
  platform,
  views,
  growth,
  growthLabel,
  selectedPlatform,
}: PlatformMiniCardProps) {
  const active = selectedPlatform === 'all' || selectedPlatform === platform;

  return (
    <div
      className={[
        'rounded-card border px-4 py-4 transition-all',
        active
          ? 'border-accent/40 bg-surface text-text-primary opacity-100'
          : 'border-border bg-surface/60 text-text-muted opacity-55',
      ].join(' ')}
    >
      <p className="text-xs uppercase tracking-widest">{PLATFORM_LABELS[platform]}</p>
      <p className="mt-2 text-lg font-semibold">{formatNumber(views)} views</p>
      <p className="mt-1 text-sm">
        {formatNumber(growth)} {growthLabel}
      </p>
    </div>
  );
}
