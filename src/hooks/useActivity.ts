import { useState, useEffect, useCallback } from 'react';
import { getActivityLog } from '../api/sheets';
import type { ActivityEntry } from '../types';

export function useActivity(limit = 50) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getActivityLog(limit);
      setActivity(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activity, loading, refresh };
}
