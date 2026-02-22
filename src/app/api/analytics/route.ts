import type {
  AnalyticsPlatform,
  AnalyticsRange,
  AnalyticsResponse,
  TimeseriesPoint,
  TopContentItem,
} from '../../../lib/analyticsTypes';

const RANGE_POINTS: Record<AnalyticsRange, number> = {
  '24h': 2,
  '7d': 7,
  '28d': 28,
  '90d': 30,
  custom: 14,
};

const PLATFORM_WEIGHTS: Record<Exclude<AnalyticsPlatform, 'all'>, number> = {
  tiktok: 0.44,
  instagram: 0.33,
  youtube: 0.23,
};

const clamp = (value: number, min = 0): number => (value < min ? min : value);

const parsePlatform = (input: string | null): AnalyticsPlatform => {
  if (input === 'tiktok' || input === 'instagram' || input === 'youtube' || input === 'all') {
    return input;
  }
  return 'all';
};

const parseRange = (input: string | null): AnalyticsRange => {
  if (input === '24h' || input === '7d' || input === '28d' || input === '90d' || input === 'custom') {
    return input;
  }
  return '7d';
};

const parseCompare = (input: string | null): boolean => {
  if (!input) return true;
  return !(input === 'false' || input === '0' || input === 'off');
};

const buildTimeseries = (count: number, platform: AnalyticsPlatform, scale: number): TimeseriesPoint[] => {
  const today = new Date();
  const rows: TimeseriesPoint[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    const wave = Math.sin((count - index) / 2.4);
    const trend = (count - index) * 34;
    const baseViews = 9800 * scale + trend + wave * 1200;

    const tiktok = clamp(Math.round(baseViews * PLATFORM_WEIGHTS.tiktok));
    const instagram = clamp(Math.round(baseViews * PLATFORM_WEIGHTS.instagram));
    const youtube = clamp(Math.round(baseViews * PLATFORM_WEIGHTS.youtube));

    const selectedViews =
      platform === 'all'
        ? tiktok + instagram + youtube
        : platform === 'tiktok'
          ? tiktok
          : platform === 'instagram'
            ? instagram
            : youtube;

    rows.push({
      date: date.toISOString().slice(0, 10),
      views: selectedViews,
      likes: clamp(Math.round(selectedViews * 0.075 + Math.cos(index) * 30)),
      comments: clamp(Math.round(selectedViews * 0.012 + Math.sin(index * 1.2) * 9)),
      shares: clamp(Math.round(selectedViews * 0.009 + Math.cos(index * 0.75) * 6)),
      followers: clamp(Math.round((tiktok + instagram) * 0.0038 + Math.sin(index) * 3)),
      subs: clamp(Math.round(youtube * 0.0042 + Math.cos(index) * 2)),
      platform:
        platform === 'all'
          ? {
              tiktok,
              instagram,
              youtube,
            }
          : undefined,
    });
  }

  return rows;
};

const sum = (values: number[]): number => values.reduce((total, current) => total + current, 0);

const deltaPct = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const makeTopContent = (platform: AnalyticsPlatform): TopContentItem[] => {
  const source: TopContentItem[] = [
    {
      id: 'yt-1',
      platform: 'youtube',
      title: 'How We Scaled Shorts to 10M Views',
      postedAt: '2026-02-14',
      views: 482100,
      likes: 21200,
      comments: 1440,
      shares: 1900,
    },
    {
      id: 'tt-1',
      platform: 'tiktok',
      title: 'POV: Editing in 30 Seconds',
      postedAt: '2026-02-18',
      views: 391400,
      likes: 33210,
      comments: 1220,
      shares: 2880,
    },
    {
      id: 'ig-1',
      platform: 'instagram',
      title: 'Reel Breakdown: 3 Hook Patterns',
      postedAt: '2026-02-11',
      views: 278600,
      likes: 19440,
      comments: 980,
      shares: 1630,
    },
    {
      id: 'tt-2',
      platform: 'tiktok',
      title: 'Creator Workflow Automation Demo',
      postedAt: '2026-02-09',
      views: 246900,
      likes: 15880,
      comments: 760,
      shares: 1260,
    },
    {
      id: 'yt-2',
      platform: 'youtube',
      title: 'Audience Retention Teardown',
      postedAt: '2026-02-02',
      views: 214500,
      likes: 11320,
      comments: 640,
      shares: 940,
    },
  ];

  return platform === 'all' ? source : source.filter((item) => item.platform === platform);
};

export const createAnalyticsMock = (
  account: string,
  platform: AnalyticsPlatform,
  range: AnalyticsRange,
  compare: boolean,
): AnalyticsResponse => {
  const points = RANGE_POINTS[range];
  const timeseries = buildTimeseries(points, platform, 1);
  const previousTimeseries = compare ? buildTimeseries(points, platform, 0.85) : undefined;

  const viewTotal = sum(timeseries.map((point) => point.views));
  const likeTotal = sum(timeseries.map((point) => point.likes));
  const commentTotal = sum(timeseries.map((point) => point.comments));
  const shareTotal = sum(timeseries.map((point) => point.shares));
  const followerTotal = sum(timeseries.map((point) => point.followers));
  const subTotal = sum(timeseries.map((point) => point.subs));

  const prevViewTotal = compare ? sum(previousTimeseries!.map((point) => point.views)) : 0;
  const prevLikeTotal = compare ? sum(previousTimeseries!.map((point) => point.likes)) : 0;
  const prevCommentTotal = compare ? sum(previousTimeseries!.map((point) => point.comments)) : 0;
  const prevShareTotal = compare ? sum(previousTimeseries!.map((point) => point.shares)) : 0;
  const prevFollowerTotal = compare ? sum(previousTimeseries!.map((point) => point.followers)) : 0;
  const prevSubTotal = compare ? sum(previousTimeseries!.map((point) => point.subs)) : 0;

  const allViewTotals = buildTimeseries(points, 'all', 1).map((point) => point.platform!);

  return {
    account,
    platform,
    range,
    totals: {
      views: { value: viewTotal, deltaPct: compare ? deltaPct(viewTotal, prevViewTotal) : undefined },
      likes: { value: likeTotal, deltaPct: compare ? deltaPct(likeTotal, prevLikeTotal) : undefined },
      comments: { value: commentTotal, deltaPct: compare ? deltaPct(commentTotal, prevCommentTotal) : undefined },
      shares: { value: shareTotal, deltaPct: compare ? deltaPct(shareTotal, prevShareTotal) : undefined },
      followers: {
        value: followerTotal,
        deltaPct: compare ? deltaPct(followerTotal, prevFollowerTotal) : undefined,
      },
      subs: { value: subTotal, deltaPct: compare ? deltaPct(subTotal, prevSubTotal) : undefined },
    },
    platformTotals: {
      tiktok: {
        views: sum(allViewTotals.map((item) => item.tiktok)),
        followers: Math.round(sum(allViewTotals.map((item) => item.tiktok)) * 0.0032),
      },
      instagram: {
        views: sum(allViewTotals.map((item) => item.instagram)),
        followers: Math.round(sum(allViewTotals.map((item) => item.instagram)) * 0.0028),
      },
      youtube: {
        views: sum(allViewTotals.map((item) => item.youtube)),
        subs: Math.round(sum(allViewTotals.map((item) => item.youtube)) * 0.0036),
      },
    },
    timeseries,
    previousTimeseries,
    topContent: makeTopContent(platform),
    insights: [
      { level: 'success', text: 'Views are outperforming the previous period by double digits.' },
      { level: 'info', text: 'TikTok contributes the largest share of discovery traffic this range.' },
      { level: 'warn', text: 'Share rate dipped mid-range on Instagram Reels.' },
      { level: 'info', text: 'YouTube retention-driven videos lifted subscription conversion.' },
    ],
  };
};

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account') ?? '9to5doggo';
  const platform = parsePlatform(searchParams.get('platform'));
  const range = parseRange(searchParams.get('range'));
  const compare = parseCompare(searchParams.get('compare'));

  return Response.json(createAnalyticsMock(account, platform, range, compare));
}
