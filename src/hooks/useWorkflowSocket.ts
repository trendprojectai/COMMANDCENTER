// src/hooks/useWorkflowSocket.ts
// WebSocket hook for receiving real-time n8n workflow events from the local server.
// The server (server/index.js) listens for POST webhooks from n8n and broadcasts
// them to all connected WebSocket clients.
import { useState, useEffect, useRef, useCallback } from 'react';

export interface WorkflowEvent {
  event: 'start' | 'complete' | 'fail';
  task_name: string;
  agent_id: string;
  run_id: string;
  started_at?: number;
  result_url?: string;
  completed_at?: number;
  error?: string;
  failed_at?: number;
}

export function useWorkflowSocket(url = 'ws://localhost:3001') {
  const [workflowEvent, setWorkflowEvent] = useState<WorkflowEvent | null>(null);
  const [connected, setConnected]         = useState(false);
  const wsRef     = useRef<WebSocket | null>(null);
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true);
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data) as WorkflowEvent;
          setWorkflowEvent(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        // Auto-reconnect after 3s
        retryRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose → retry
      };
    } catch {
      // WebSocket constructor failed (e.g. server not running)
      retryRef.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { workflowEvent, connected };
}
