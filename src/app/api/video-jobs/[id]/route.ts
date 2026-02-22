import { videoJobsStore } from '../../../../lib/videoJobsStore';
import type { VideoStatus } from '../../../../types/video';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const job = videoJobsStore.get(params.id);
  if (!job) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  const body = await request.json() as {
    videoUrl?: string;
    thumbUrl?: string;
    durationSeconds?: number;
    status?: VideoStatus;
    notes?: string;
  };

  const updated = {
    ...job,
    ...(body.videoUrl      !== undefined && { videoUrl: body.videoUrl }),
    ...(body.thumbUrl      !== undefined && { thumbUrl: body.thumbUrl }),
    ...(body.durationSeconds !== undefined && { durationSeconds: body.durationSeconds }),
    ...(body.status        !== undefined && { status: body.status }),
    ...(body.notes         !== undefined && { notes: body.notes }),
    updatedAt: new Date().toISOString(),
  };

  videoJobsStore.set(params.id, updated);
  return Response.json({ job: updated });
}
