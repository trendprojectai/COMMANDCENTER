// src/api/sheets.ts
// TODO: Replace mock data with real Google Sheets API calls
// Real implementation will use:
//   GET /spreadsheets/{id}/values/{range}  — read data
//   PUT /spreadsheets/{id}/values/{range}  — update data
//   POST /spreadsheets/{id}/values/{range}:append — append rows

import type { Agent, AgentRun, ActivityEntry, StageLogEntry } from '../types';

const WEBHOOKS_KEY = 'gbot_agent_webhooks';

function loadSavedWebhooks(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(WEBHOOKS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveWebhooks(map: Record<string, string>): void {
  localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(map));
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_AGENTS: Agent[] = [
  { id: 'agent_1', name: 'AGENT 1', slug: 'agent-1', sprite_key: 'agent-1', webhook_url: '', stages: [], status: 'idle', last_run_at: null, last_result_url: null },
  { id: 'agent_2', name: 'AGENT 2', slug: 'agent-2', sprite_key: 'agent-2', webhook_url: '', stages: [], status: 'idle', last_run_at: null, last_result_url: null },
  { id: 'agent_3', name: 'AGENT 3', slug: 'agent-3', sprite_key: 'agent-3', webhook_url: '', stages: [], status: 'idle', last_run_at: null, last_result_url: null },
  { id: 'agent_4', name: 'AGENT 4', slug: 'agent-4', sprite_key: 'agent-4', webhook_url: '', stages: [], status: 'idle', last_run_at: null, last_result_url: null },
  { id: 'agent_5', name: 'AGENT 5', slug: 'agent-5', sprite_key: 'agent-5', webhook_url: '', stages: [], status: 'idle', last_run_at: null, last_result_url: null },
  { id: 'agent_6', name: 'AGENT 6', slug: 'agent-6', sprite_key: 'agent-6', webhook_url: '', stages: [], status: 'idle', last_run_at: null, last_result_url: null },
];

let _agents: Agent[] = [...MOCK_AGENTS];

const _runs: Map<string, AgentRun> = new Map();

const _activity: ActivityEntry[] = [
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    agent_id: 'agent_001',
    run_id: 'run_demo_001',
    message: 'Workflow complete — video ready!',
    level: 'success',
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    agent_id: 'agent_001',
    run_id: 'run_demo_001',
    message: 'GET_FINAL stage complete — retrieving video URL',
    level: 'info',
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    agent_id: 'agent_001',
    run_id: 'run_demo_001',
    message: 'Video upscaled to HD',
    level: 'info',
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    agent_id: 'agent_001',
    run_id: 'run_demo_001',
    message: 'Video generated successfully',
    level: 'info',
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    agent_id: 'agent_001',
    run_id: 'run_demo_001',
    message: 'STORY complete — script generated',
    level: 'info',
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 12.5).toISOString(),
    agent_id: 'agent_001',
    run_id: 'run_demo_001',
    message: 'Cat Winter Olympics started',
    level: 'info',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `run_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function simulateDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// API — Agents
// ---------------------------------------------------------------------------

export async function getAgents(): Promise<Agent[]> {
  await simulateDelay();
  const saved = loadSavedWebhooks();
  return _agents.map((a) => ({
    ...a,
    webhook_url: saved[a.id] ?? a.webhook_url,
  }));
}

export async function updateAgentWebhook(agentId: string, url: string): Promise<void> {
  const saved = loadSavedWebhooks();
  if (url) {
    saved[agentId] = url;
  } else {
    delete saved[agentId];
  }
  saveWebhooks(saved);
  _agents = _agents.map((a) => (a.id === agentId ? { ...a, webhook_url: url } : a));
}

export async function updateAgentStatus(
  agentId: string,
  patch: Partial<Pick<Agent, 'status' | 'last_run_at' | 'last_result_url'>>
): Promise<void> {
  _agents = _agents.map((a) => (a.id === agentId ? { ...a, ...patch } : a));
  // TODO: PUT to Google Sheets Agents tab row matching agentId
}

// ---------------------------------------------------------------------------
// API — Runs
// ---------------------------------------------------------------------------

export async function getActiveRun(agentId: string): Promise<AgentRun | null> {
  await simulateDelay(200);
  for (const run of _runs.values()) {
    if (run.agent_id === agentId && run.status === 'running') return { ...run };
  }
  return null;
}

export async function createRun(agentId: string): Promise<AgentRun> {
  const agent = _agents.find((a) => a.id === agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const run_id = generateRunId();
  const now = new Date().toISOString();

  const stageLog: StageLogEntry[] = agent.stages.map((stage, i) => ({
    stage,
    status: i === 0 ? 'running' : 'pending',
    started_at: i === 0 ? now : null,
    finished_at: null,
  }));

  const run: AgentRun = {
    run_id,
    agent_id: agentId,
    status: 'running',
    current_stage: agent.stages[0],
    stage_log: stageLog,
    started_at: now,
    finished_at: null,
    result_url: null,
  };

  _runs.set(run_id, run);

  // Update agent status
  await updateAgentStatus(agentId, { status: 'running', last_run_at: now });

  // Append to activity
  _activity.unshift({
    timestamp: now,
    agent_id: agentId,
    run_id,
    message: `${agent.name} started`,
    level: 'info',
  });

  // TODO: POST /spreadsheets/{id}/values/{range}:append to Runs sheet
  // TODO: POST /spreadsheets/{id}/values/{range}:append to Activity sheet

  return { ...run };
}

// ---------------------------------------------------------------------------
// API — Trigger
// ---------------------------------------------------------------------------

export async function triggerAgent(agent: Agent, runId: string): Promise<void> {
  if (!agent.webhook_url) {
    console.warn(`[sheets] No webhook URL for agent ${agent.id} — skipping trigger`);
    return;
  }

  const response = await fetch(agent.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ run_id: runId, agent_id: agent.id }),
  });

  if (!response.ok) {
    throw new Error(`Webhook trigger failed: ${response.status} ${response.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// API — Activity
// ---------------------------------------------------------------------------

export async function getActivityLog(limit = 50): Promise<ActivityEntry[]> {
  await simulateDelay(200);
  return _activity.slice(0, limit);
}
