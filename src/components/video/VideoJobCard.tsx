import type { VideoJob, VideoStatus } from '../../types/video';

const STATUS_COLOR: Record<VideoStatus, string> = {
  RENDERING:        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  READY_FOR_REVIEW: 'bg-accent/20 text-accent border-accent/30',
  BURNING_IN:       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  READY_TO_PUSH:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  PUSHING:          'bg-blue-500/20 text-blue-300 border-blue-500/30',
  POSTED:           'bg-success/20 text-success border-success/30',
  FAILED:           'bg-failed/20 text-failed border-failed/30',
};

const STATUS_LABEL: Record<VideoStatus, string> = {
  RENDERING:        'Rendering',
  READY_FOR_REVIEW: 'Review',
  BURNING_IN:       'Burning',
  READY_TO_PUSH:    'Ready',
  PUSHING:          'Pushing',
  POSTED:           'Posted',
  FAILED:           'Failed',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface VideoJobCardProps {
  job: VideoJob;
  isSelected: boolean;
  onSelect: (job: VideoJob) => void;
}

export function VideoJobCard({ job, isSelected, onSelect }: VideoJobCardProps) {
  const thumbSrc = job.thumbUrl ?? null;

  return (
    <button
      onClick={() => onSelect(job)}
      className={[
        'w-full text-left p-3 flex gap-3 items-start transition-colors border-b border-border',
        isSelected
          ? 'bg-accent/10 ring-inset ring-1 ring-accent/40'
          : 'hover:bg-surface/80',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-10 h-16 rounded overflow-hidden bg-bg border border-border">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            No thumb
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate leading-tight">
          {job.title ?? job.accountId}
        </p>
        {job.title && (
          <p className="text-xs text-text-muted truncate mt-0.5">{job.accountId}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={[
              'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border',
              STATUS_COLOR[job.status as VideoStatus] ?? 'bg-border/30 text-text-muted border-border',
            ].join(' ')}
          >
            {STATUS_LABEL[job.status as VideoStatus] ?? job.status}
          </span>
          <span className="text-[11px] text-text-muted">{timeAgo(job.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}
