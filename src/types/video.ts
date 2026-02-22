export type VideoStatus =
  | 'RENDERING'
  | 'READY_FOR_REVIEW'
  | 'BURNING_IN'
  | 'READY_TO_PUSH'
  | 'PUSHING'
  | 'POSTED'
  | 'FAILED';

export type StylePreset = 'bold-white' | 'outline-black' | 'neon-glow' | 'clean-minimal';

export type CaptionPosition = 'top' | 'bottom';

export type BurnStatus = 'queued' | 'processing' | 'done' | 'failed';

export type PublishPlatform = 'tiktok' | 'instagram' | 'youtube';

export type PublishStatus = 'queued' | 'posting' | 'success' | 'failed';

export interface VideoCaption {
  id: string;
  videoJobId: string;
  captionText: string;
  stylePreset: StylePreset;
  position: CaptionPosition;
  safeArea: boolean;
  burnedVideoUrl: string | null;
  burnStatus: BurnStatus;
  createdAt: string;
}

export interface PublishJob {
  id: string;
  videoJobId: string;
  platform: PublishPlatform;
  publishStatus: PublishStatus;
  platformPostId: string | null;
  scheduledFor: string | null;
  caption: string | null;
  createdAt: string;
}

export interface VideoJob {
  id: string;
  accountId: string;
  workflowRunId: string | null;
  title: string | null;
  status: VideoStatus;
  videoUrl: string;
  thumbUrl: string | null;
  durationSeconds: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  captions?: VideoCaption[];
  publishes?: PublishJob[];
}
