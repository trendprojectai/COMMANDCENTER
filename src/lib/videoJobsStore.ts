import type { VideoJob } from '../types/video';

const g = globalThis as typeof globalThis & { _videoJobsStore?: Map<string, VideoJob> };
export const videoJobsStore: Map<string, VideoJob> = (g._videoJobsStore ??= new Map());
