import { useState, useEffect, useCallback } from 'react';
import { Film, RefreshCw, Flame, Send, ChevronUp, ChevronDown } from 'lucide-react';
import { useVideoJobs } from '../hooks/useVideoJobs';
import { VideoJobCard } from '../components/video/VideoJobCard';
import type { VideoStatus, StylePreset, CaptionPosition, PublishPlatform, VideoJob } from '../types/video';

// ── Status constants ──────────────────────────────────────────────────────────

const ALL_STATUSES: VideoStatus[] = [
  'READY_FOR_REVIEW', 'BURNING_IN', 'READY_TO_PUSH', 'PUSHING', 'POSTED', 'RENDERING', 'FAILED',
];

const STATUS_LABEL: Record<VideoStatus, string> = {
  RENDERING:        'Rendering',
  READY_FOR_REVIEW: 'Review',
  BURNING_IN:       'Burning',
  READY_TO_PUSH:    'Ready',
  PUSHING:          'Pushing',
  POSTED:           'Posted',
  FAILED:           'Failed',
};

const STYLE_PRESETS: Array<{ value: StylePreset; label: string }> = [
  { value: 'bold-white',    label: 'Bold White' },
  { value: 'outline-black', label: 'Outline Black' },
  { value: 'neon-glow',     label: 'Neon Glow' },
  { value: 'clean-minimal', label: 'Clean Minimal' },
];

const PLATFORMS: Array<{ value: PublishPlatform; label: string }> = [
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function burnStatusColor(s: string) {
  if (s === 'done')       return 'text-success';
  if (s === 'failed')     return 'text-failed';
  if (s === 'processing') return 'text-blue-300';
  return 'text-text-muted';
}

function publishStatusColor(s: string) {
  if (s === 'success') return 'text-success';
  if (s === 'failed')  return 'text-failed';
  if (s === 'posting') return 'text-blue-300';
  return 'text-text-muted';
}

// ── Section card wrapper ──────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Label + input helpers ─────────────────────────────────────────────────────

const inputCls = 'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50';
const btnPrimary = 'flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-40';
const btnOutline = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? 'border-accent bg-accent/20 text-accent'
      : 'border-border text-text-muted hover:border-accent/50 hover:text-text-primary'
  }`;

// ── Main Page ─────────────────────────────────────────────────────────────────

export function VideoReview() {
  const { jobs, selectedJob, setSelectedJob, loading, error, fetchJobs, refreshSelected } = useVideoJobs();

  // Left-column filters
  const [accountFilter, setAccountFilter] = useState('9to5doggo');
  const [statusFilter,  setStatusFilter]  = useState<VideoStatus | ''>('');
  const [searchQuery,   setSearchQuery]   = useState('');

  // Video player
  const [showBurned, setShowBurned] = useState(false);

  // Caption builder
  const [captionText,  setCaptionText]  = useState('');
  const [stylePreset,  setStylePreset]  = useState<StylePreset>('bold-white');
  const [capPosition,  setCapPosition]  = useState<CaptionPosition>('bottom');
  const [safeArea,     setSafeArea]     = useState(true);
  const [burning,      setBurning]      = useState(false);
  const [burnError,    setBurnError]    = useState<string | null>(null);

  // Publish
  const [pushPlatforms, setPushPlatforms] = useState<PublishPlatform[]>([]);
  const [pushCaption,   setPushCaption]   = useState('');
  const [scheduleMode,  setScheduleMode]  = useState<'now' | 'scheduled'>('now');
  const [scheduledFor,  setScheduledFor]  = useState('');
  const [pushing,       setPushing]       = useState(false);
  const [pushError,     setPushError]     = useState<string | null>(null);

  // Debounced fetch on filter change
  useEffect(() => {
    const t = setTimeout(() => {
      fetchJobs(accountFilter || undefined, statusFilter || undefined);
    }, 400);
    return () => clearTimeout(t);
  }, [accountFilter, statusFilter, fetchJobs]);

  // Poll for new jobs every 10 seconds
  useEffect(() => {
    const id = setInterval(() => {
      fetchJobs(accountFilter || undefined, statusFilter || undefined);
    }, 10_000);
    return () => clearInterval(id);
  }, [accountFilter, statusFilter, fetchJobs]);

  // Reset burn state when job changes
  useEffect(() => {
    setShowBurned(false);
    setBurnError(null);
    setPushError(null);
  }, [selectedJob?.id]);

  // Client-side search filter
  const filteredJobs = searchQuery.trim()
    ? jobs.filter((j) => {
        const q = searchQuery.toLowerCase();
        return (
          j.title?.toLowerCase().includes(q) ||
          j.accountId.toLowerCase().includes(q)
        );
      })
    : jobs;

  // Computed video source
  const latestCaption = selectedJob?.captions?.[0] ?? null;
  const videoSrc = selectedJob
    ? showBurned && latestCaption?.burnedVideoUrl
      ? latestCaption.burnedVideoUrl
      : selectedJob.videoUrl
    : undefined;

  // Burn in handler
  const handleBurnIn = useCallback(async () => {
    if (!selectedJob || !captionText.trim()) return;
    setBurning(true);
    setBurnError(null);
    try {
      const res = await fetch('/api/burn-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoJobId:  selectedJob.id,
          captionText: captionText.trim(),
          stylePreset,
          position:    capPosition,
          safeArea,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        throw new Error(d.error ?? 'Request failed');
      }
      await refreshSelected();
    } catch (e) {
      setBurnError(e instanceof Error ? e.message : 'Burn failed');
    } finally {
      setBurning(false);
    }
  }, [selectedJob, captionText, stylePreset, capPosition, safeArea, refreshSelected]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    if (!selectedJob || pushPlatforms.length === 0) return;
    setPushing(true);
    setPushError(null);
    try {
      const body: Record<string, unknown> = {
        videoJobId: selectedJob.id,
        platforms: pushPlatforms,
        caption: pushCaption || undefined,
      };
      if (scheduleMode === 'scheduled' && scheduledFor) {
        body.scheduledFor = scheduledFor;
      }
      const res = await fetch('/api/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        throw new Error(d.error ?? 'Request failed');
      }
      await refreshSelected();
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPushing(false);
    }
  }, [selectedJob, pushPlatforms, pushCaption, scheduleMode, scheduledFor, refreshSelected]);

  function togglePlatform(p: PublishPlatform) {
    setPushPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left column ────────────────────────────────────────────────────── */}
      <aside className="w-[280px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-text-primary">Video Review</span>
          </div>
          <button
            onClick={() => fetchJobs(accountFilter || undefined, statusFilter || undefined)}
            disabled={loading}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-border space-y-2">
          <input
            type="text"
            placeholder="Account ID…"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Search title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputCls}
          />
          {/* Status chips */}
          <div className="flex flex-wrap gap-1 pt-1">
            <button
              onClick={() => setStatusFilter('')}
              className={btnOutline(statusFilter === '')}
            >
              All
            </button>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={btnOutline(statusFilter === s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto scrollbar-dark">
          {error && (
            <p className="p-4 text-xs text-failed">{error}</p>
          )}
          {!error && filteredJobs.length === 0 && !loading && (
            <p className="p-4 text-xs text-text-muted text-center">No jobs found.</p>
          )}
          {filteredJobs.map((job) => (
            <VideoJobCard
              key={job.id}
              job={job}
              isSelected={selectedJob?.id === job.id}
              onSelect={(j: VideoJob) => setSelectedJob(j)}
            />
          ))}
        </div>
      </aside>

      {/* ── Right column ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollbar-dark p-4 space-y-4 bg-bg">
        {!selectedJob ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted gap-3">
            <Film className="h-10 w-10 opacity-20" />
            <p className="text-sm">Select a video job to review</p>
          </div>
        ) : (
          <>
            {/* Video player */}
            <Card title="Player">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative rounded-md overflow-hidden border border-border bg-black"
                  style={{ width: 'min(100%, 320px)', aspectRatio: '9/16' }}
                >
                  {videoSrc ? (
                    <video
                      key={videoSrc}
                      src={videoSrc}
                      controls
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                      No video file
                    </div>
                  )}
                </div>

                {/* Original / Burned toggle */}
                {latestCaption?.burnedVideoUrl && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBurned(false)}
                      className={btnOutline(!showBurned)}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setShowBurned(true)}
                      className={btnOutline(showBurned)}
                    >
                      Burned
                    </button>
                  </div>
                )}

                {/* Job title & status */}
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">
                    {selectedJob.title ?? selectedJob.accountId}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Status: <span className="text-accent">{selectedJob.status}</span>
                    {selectedJob.durationSeconds ? ` · ${selectedJob.durationSeconds}s` : ''}
                  </p>
                </div>
              </div>
            </Card>

            {/* Caption builder */}
            <Card title="Caption Builder">
              <div className="space-y-3">
                <textarea
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Caption text…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Style</label>
                    <select
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value as StylePreset)}
                      className={inputCls}
                    >
                      {STYLE_PRESETS.map(({ value, label }) => (
                        <option key={value} value={value} className="bg-surface">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Position</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCapPosition('top')}
                        className={`${btnOutline(capPosition === 'top')} flex items-center gap-1 flex-1 justify-center`}
                      >
                        <ChevronUp className="h-3 w-3" /> Top
                      </button>
                      <button
                        onClick={() => setCapPosition('bottom')}
                        className={`${btnOutline(capPosition === 'bottom')} flex items-center gap-1 flex-1 justify-center`}
                      >
                        <ChevronDown className="h-3 w-3" /> Bottom
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safeArea}
                    onChange={(e) => setSafeArea(e.target.checked)}
                    className="accent-accent"
                  />
                  <span className="text-xs text-text-muted">Safe area margin</span>
                </label>

                {burnError && (
                  <p className="text-xs text-failed">{burnError}</p>
                )}

                <button
                  onClick={handleBurnIn}
                  disabled={burning || !captionText.trim() || selectedJob.status === 'BURNING_IN'}
                  className={btnPrimary}
                >
                  <Flame className="h-4 w-4" />
                  {burning || selectedJob.status === 'BURNING_IN' ? 'Burning…' : 'Burn In'}
                </button>
              </div>
            </Card>

            {/* Push section */}
            <Card title="Publish">
              <div className="space-y-3">
                {/* Platform toggles */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Platforms</label>
                  <div className="flex gap-2">
                    {PLATFORMS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => togglePlatform(value)}
                        className={btnOutline(pushPlatforms.includes(value))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Schedule</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setScheduleMode('now')}
                      className={btnOutline(scheduleMode === 'now')}
                    >
                      Now
                    </button>
                    <button
                      onClick={() => setScheduleMode('scheduled')}
                      className={btnOutline(scheduleMode === 'scheduled')}
                    >
                      Scheduled
                    </button>
                  </div>
                  {scheduleMode === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>

                {/* Caption */}
                <textarea
                  value={pushCaption}
                  onChange={(e) => setPushCaption(e.target.value)}
                  placeholder="Post caption…"
                  rows={2}
                  className={`${inputCls} resize-none`}
                />

                {/* Per-platform statuses */}
                {selectedJob.publishes && selectedJob.publishes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.publishes.slice(0, 6).map((pub) => (
                      <span
                        key={pub.id}
                        className={`text-xs font-medium ${publishStatusColor(pub.publishStatus)}`}
                      >
                        {pub.platform}: {pub.publishStatus}
                      </span>
                    ))}
                  </div>
                )}

                {pushError && (
                  <p className="text-xs text-failed">{pushError}</p>
                )}

                <button
                  onClick={handlePublish}
                  disabled={pushing || pushPlatforms.length === 0 || selectedJob.status === 'PUSHING'}
                  className={btnPrimary}
                >
                  <Send className="h-4 w-4" />
                  {pushing || selectedJob.status === 'PUSHING' ? 'Pushing…' : 'Push'}
                </button>
              </div>
            </Card>

            {/* Activity log */}
            <Card title="Activity Log">
              {(!selectedJob.captions?.length && !selectedJob.publishes?.length) ? (
                <p className="text-xs text-text-muted">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {/* Captions */}
                  {selectedJob.captions?.map((cap) => (
                    <div key={cap.id} className="flex items-start gap-2 text-xs">
                      <span className="text-text-muted mt-0.5 flex-shrink-0">🔥</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-text-primary truncate block">
                          "{cap.captionText.length > 40
                            ? cap.captionText.slice(0, 40) + '…'
                            : cap.captionText}"
                        </span>
                        <span className="text-text-muted">
                          {cap.stylePreset} · {cap.position}
                          {' · '}
                          <span className={burnStatusColor(cap.burnStatus)}>
                            {cap.burnStatus}
                            {cap.burnStatus === 'processing' && (
                              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                            )}
                          </span>
                          {' · '}
                          {timeAgo(cap.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Publishes */}
                  {selectedJob.publishes?.map((pub) => (
                    <div key={pub.id} className="flex items-start gap-2 text-xs">
                      <span className="text-text-muted mt-0.5 flex-shrink-0">📤</span>
                      <div className="flex-1">
                        <span className="text-text-primary">{pub.platform}</span>
                        {' · '}
                        <span className={publishStatusColor(pub.publishStatus)}>
                          {pub.publishStatus}
                        </span>
                        {pub.platformPostId && (
                          <span className="text-text-muted ml-1">({pub.platformPostId})</span>
                        )}
                        {' · '}
                        <span className="text-text-muted">{timeAgo(pub.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
