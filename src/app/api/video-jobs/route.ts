import { videoJobsStore } from '../../../lib/videoJobsStore';
import type { VideoJob, VideoStatus } from '../../../types/video';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  let jobs = Array.from(videoJobsStore.values());

  if (accountId) {
    jobs = jobs.filter((j) => j.accountId === accountId);
  }

  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json({ jobs });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as {
    accountId?: string;
    workflowRunId?: string;
    title?: string;
    status?: VideoStatus;
  };

  if (!body.accountId) {
    return Response.json({ error: 'accountId is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const job: VideoJob = {
    id: crypto.randomUUID(),
    accountId: body.accountId,
    workflowRunId: body.workflowRunId ?? null,
    title: body.title ?? null,
    status: body.status ?? 'RENDERING',
    videoUrl: '',
    thumbUrl: null,
    durationSeconds: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  videoJobsStore.set(job.id, job);
  return Response.json({ job }, { status: 201 });
}
