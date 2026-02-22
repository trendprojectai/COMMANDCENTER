import { useState, useCallback, useEffect, useRef } from 'react';
import type { VideoJob } from '../types/video';

export function useVideoJobs() {
  const [jobs,        setJobs]        = useState<VideoJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<VideoJob | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async (accountId?: string, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (accountId) params.set('accountId', accountId);
      if (status)    params.set('status', status);
      const res  = await fetch(`/api/video-jobs?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { jobs: VideoJob[] };
      setJobs(data.jobs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSelected = useCallback(async () => {
    if (!selectedJob) return;
    try {
      const res  = await fetch(`/api/video-jobs/${selectedJob.id}`);
      if (!res.ok) return;
      const data = await res.json() as { job: VideoJob };
      if (data.job) {
        setSelectedJob(data.job);
        setJobs((prev) => prev.map((j) => (j.id === data.job.id ? { ...j, status: data.job.status } : j)));
      }
    } catch {
      // polling — ignore errors
    }
  }, [selectedJob]);

  // Poll while job is in an active state
  useEffect(() => {
    const active =
      selectedJob?.status === 'BURNING_IN' ||
      selectedJob?.status === 'PUSHING' ||
      selectedJob?.status === 'RENDERING';

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (active) {
      pollRef.current = setInterval(refreshSelected, 3000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [selectedJob?.status, refreshSelected]);

  return {
    jobs,
    selectedJob,
    setSelectedJob,
    loading,
    error,
    fetchJobs,
    refreshSelected,
  };
}
