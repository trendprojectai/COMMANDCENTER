import { useEffect, useRef } from 'react';
import type { Agent } from '../types';

const POLL_ACTIVE_MS = 4000;  // 4s when any agent is running
const POLL_IDLE_MS = 30000;   // 30s when all agents are idle

interface UseAgentPollingOptions {
  agents: Agent[];
  onTick: () => void;
}

/**
 * Polls at a fast rate when any agent is running, slow rate when idle.
 * Calls `onTick` on each poll so callers can refresh their data.
 */
export function useAgentPolling({ agents, onTick }: UseAgentPollingOptions) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const hasRunning = agents.some((a) => a.status === 'running');

  useEffect(() => {
    const interval = setInterval(() => {
      onTickRef.current();
    }, hasRunning ? POLL_ACTIVE_MS : POLL_IDLE_MS);

    return () => clearInterval(interval);
  }, [hasRunning]);
}
