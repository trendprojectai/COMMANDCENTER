export interface Agent {
  id: string;
  name: string;
  slug: string;
  sprite_key: string;
  webhook_url: string;
  stages: string[];
  status: 'idle' | 'running' | 'cancelling' | 'complete' | 'failed';
  last_run_at: string | null;
  last_result_url: string | null;
}

export interface AgentRun {
  run_id: string;
  agent_id: string;
  status: 'running' | 'complete' | 'failed';
  current_stage: string;
  stage_log: StageLogEntry[];
  started_at: string;
  finished_at: string | null;
  result_url: string | null;
}

export interface StageLogEntry {
  stage: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  started_at: string | null;
  finished_at: string | null;
}

export interface ActivityEntry {
  timestamp: string;
  agent_id: string;
  run_id: string;
  message: string;
  level: 'info' | 'success' | 'error';
}
