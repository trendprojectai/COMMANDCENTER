// src/components/office/OfficeCanvas.tsx
// Main isometric room orchestrator — Habbo Hotel-style bright aesthetic.
// Floor/wall rendering is delegated to sub-components; furniture defined as data arrays.

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  GRID_W,
  GRID_H,
  NATURAL_ORIGIN_X,
  NATURAL_ORIGIN_Y,
  TILE_W,
  tileToScreen,
  spriteZIndex,
} from '../../utils/isometric';
import {
  BG_SKY,
  GLOW_WARM,
  GLOW_COOL,
  GRID_LABEL,
  BTN_IDLE_BG,
  BTN_IDLE_TEXT,
  BTN_DONE_BG,
  BTN_BUSY_BG,
  BTN_BUSY_TEXT,
  BOX_SOFA_CUSHION, BOX_SOFA_FRAME,
  BOX_POOL_FELT, BOX_POOL_RAIL,
  BOX_FRIDGE_BODY, BOX_FRIDGE_TRIM, BOX_FRIDGE_SIDE,
  BOX_COFFEE_BODY, BOX_COFFEE_TOP, BOX_COFFEE_SIDE,
  BOX_TV_BODY, BOX_TV_SCREEN, BOX_TV_SIDE,
  BOX_BEANBAG_RED, BOX_BEANBAG_YELLOW,
  RUG_TOP, RUG_LEFT, RUG_RIGHT,
  VEND_SNACK_BODY, VEND_SNACK_SIDE,
  VEND_DRINKS_BODY, VEND_DRINKS_SIDE,
  CHAIR_WS01, CHAIR_WS02, CHAIR_WS03, CHAIR_WS04, CHAIR_WS05, CHAIR_WS06,
} from '../../utils/habboColors';
import { OfficeFloor } from './OfficeFloor';
import { OfficeWalls } from './OfficeWalls';
import { IsoBox } from './IsoBox';
import type { IsoBoxProps } from './IsoBox';
import { FishTank } from './FishTank';
import { Workstation } from './Workstation';
import type { DeskItemType } from './Workstation';
import { AgentSprite } from './AgentSprite';
import { PlantSprite } from './PlantSprite';
import { CatSprite } from './CatSprite';
import { useStationStates } from '../../hooks/useStationStates';
import { useCatWander } from '../../hooks/useCatWander';
import { useWorkflowSocket } from '../../hooks/useWorkflowSocket';
import { useAgents } from '../../hooks/useAgents';
import { updateAgentStatus } from '../../api/sheets';
import type { Agent } from '../../types';

// ── Workstation configuration ─────────────────────────────────────────────────

const WORKSTATIONS: {
  col: number; row: number; label: string;
  color: string; chairColor: string; deskItem: DeskItemType;
}[] = [
  { col: 8,  row: 2, label: 'WS-01', color: '#7A9EC8', chairColor: CHAIR_WS01, deskItem: 'plant'  },
  { col: 10, row: 2, label: 'WS-02', color: '#7A9EC8', chairColor: CHAIR_WS02, deskItem: 'mug'    },
  { col: 12, row: 2, label: 'WS-03', color: '#7A9EC8', chairColor: CHAIR_WS03, deskItem: 'frame'  },
  { col: 14, row: 2, label: 'WS-04', color: '#7A9EC8', chairColor: CHAIR_WS04, deskItem: 'ball'   },
  { col: 16, row: 2, label: 'WS-05', color: '#7A9EC8', chairColor: CHAIR_WS05, deskItem: 'figure' },
  { col: 18, row: 2, label: 'WS-06', color: '#7A9EC8', chairColor: CHAIR_WS06, deskItem: 'papers' },
];

// ── Per-agent visual and position config (index matches WORKSTATIONS + MOCK_AGENTS order) ──
const AGENT_VISUAL_CONFIGS = [
  // idx 0 → AGENT 1 (WS-01, red) — casual hoodie, dark hair
  { idleCol: 4, idleRow: 13, workstationCol: 8,  bodyColor: CHAIR_WS01, hairColor: '#2A1A08', skinColor: '#C9956A' },
  // idx 1 → AGENT 2 (WS-02, blue) — blonde hair, glasses
  { idleCol: 5, idleRow: 13, workstationCol: 10, bodyColor: CHAIR_WS02, hairColor: '#E8C840', skinColor: '#D4956A', hasGlasses: true },
  // idx 2 → AGENT 3 (WS-03, green) — dark skin, headphones
  { idleCol: 3, idleRow: 13, workstationCol: 12, bodyColor: CHAIR_WS03, hairColor: '#1A1A1A', skinColor: '#7A4A2A', hasHeadphones: true },
  // idx 3 → AGENT 4 (WS-04, yellow) — cap
  { idleCol: 4, idleRow: 14, workstationCol: 14, bodyColor: CHAIR_WS04, hairColor: '#8B4513', skinColor: '#B8834A', hasCap: true },
  // idx 4 → AGENT 5 (WS-05, purple) — light skin, auburn hair
  { idleCol: 5, idleRow: 14, workstationCol: 16, bodyColor: CHAIR_WS05, hairColor: '#C8A870', skinColor: '#F0C8A0' },
  // idx 5 → AGENT 6 (WS-06, orange) — grey hair, beard
  { idleCol: 3, idleRow: 14, workstationCol: 18, bodyColor: CHAIR_WS06, hairColor: '#888888', skinColor: '#B8803A', hasBeard: true },
] as const;

// ── Break room furniture (reorganized: items along walls, open center) ────────

type FurnitureConfig = Omit<IsoBoxProps, 'originX' | 'originY'>;

const BREAKROOM_FURNITURE: FurnitureConfig[] = [
  // Left wall: Fridge (col 1, near back)
  {
    col: 1, row: 9, colSpan: 1, boxHeight: 38,
    variant: 'fridge',
    topColor: BOX_FRIDGE_BODY, leftColor: BOX_FRIDGE_SIDE, rightColor: BOX_FRIDGE_TRIM,
  },
  // Left wall: Coffee machine on counter
  {
    col: 1, row: 11, colSpan: 1, boxHeight: 22,
    variant: 'coffee-machine',
    topColor: BOX_COFFEE_TOP, leftColor: BOX_COFFEE_SIDE, rightColor: BOX_COFFEE_BODY,
  },
  // Left wall: Sofa (2 tiles wide, against wall)
  {
    col: 1, row: 13, colSpan: 2, boxHeight: 16,
    variant: 'sofa',
    topColor: BOX_SOFA_CUSHION, leftColor: BOX_SOFA_FRAME, rightColor: BOX_SOFA_FRAME,
  },
  // Back edge: Snack vending machine (neon pink)
  {
    col: 3, row: 8, colSpan: 1, boxHeight: 42,
    variant: 'vending-snack',
    topColor: VEND_SNACK_BODY, leftColor: VEND_SNACK_SIDE, rightColor: VEND_SNACK_BODY,
  },
  // Back edge: Drinks vending machine (neon blue)
  {
    col: 4, row: 8, colSpan: 1, boxHeight: 42,
    variant: 'vending-drinks',
    topColor: VEND_DRINKS_BODY, leftColor: VEND_DRINKS_SIDE, rightColor: VEND_DRINKS_BODY,
  },
  // Right side: TV on stand (against corridor wall)
  {
    col: 6, row: 9, colSpan: 1, boxHeight: 28,
    variant: 'tv-stand',
    topColor: BOX_TV_BODY, leftColor: BOX_TV_SIDE, rightColor: BOX_TV_SCREEN,
  },
  // Side area: Pool table (pushed to left side)
  {
    col: 2, row: 11, colSpan: 2, boxHeight: 24,
    variant: 'pool-table',
    topColor: BOX_POOL_FELT, leftColor: BOX_POOL_RAIL, rightColor: BOX_POOL_RAIL,
  },
  // Center: Shag rug (flat, visible carpet in open area)
  {
    col: 4, row: 12, colSpan: 2, boxHeight: 4,
    variant: 'shag-rug',
    topColor: RUG_TOP, leftColor: RUG_LEFT, rightColor: RUG_RIGHT,
  },
  // Beanbags flanking rug
  {
    col: 4, row: 14, colSpan: 1, boxHeight: 8,
    variant: 'beanbag',
    topColor: BOX_BEANBAG_RED, leftColor: '#C03030', rightColor: '#A02020',
  },
  {
    col: 5, row: 14, colSpan: 1, boxHeight: 8,
    variant: 'beanbag',
    topColor: BOX_BEANBAG_YELLOW, leftColor: '#BBAA22', rightColor: '#AA9910',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const NOTIF_W = 120;

interface N8nWorkflow {
  id: string;
  name: string;
}

interface WorkflowAssignment {
  id: string;
  name: string;
}

interface LogEntry {
  id: string;
  message: string;
  level: 'info' | 'success' | 'error' | 'warn';
  timestamp: string;
}

const ENABLED_WORKFLOWS_STORAGE_KEY = 'workflow-enabled-ids';
const ASSIGNMENTS_STORAGE_KEY = 'workflow-assignments';
const WEBHOOK_URLS_STORAGE_KEY = 'workflow-webhook-urls';

export function OfficeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoFit, setAutoFit]   = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const { agents } = useAgents();

  // Pan state — screen-space pixel offset applied to the grid transform
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Refs mirror pan state so stable callbacks can read current values without deps
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const dragRef = useRef({
    active: false,
    startMouseX: 0, startMouseY: 0,
    startPanX: 0,   startPanY: 0,
    velX: 0,        velY: 0,
    rafId: 0,
  });

  // Agent movement state machines — one per agent (React hook rules: fixed count, no loops)
  const state1 = useStationStates({ workstationCol: 8,  idleCol: 4, idleRow: 13 });
  const state2 = useStationStates({ workstationCol: 10, idleCol: 5, idleRow: 13 });
  const state3 = useStationStates({ workstationCol: 12, idleCol: 3, idleRow: 13 });
  const state4 = useStationStates({ workstationCol: 14, idleCol: 4, idleRow: 14 });
  const state5 = useStationStates({ workstationCol: 16, idleCol: 5, idleRow: 14 });
  const state6 = useStationStates({ workstationCol: 18, idleCol: 3, idleRow: 14 });
  const allAgentStates = [state1, state2, state3, state4, state5, state6];

  const cat = useCatWander();
  const agentStateMap: Record<string, typeof state1> = {
    'agent_1': state1, 'agent_2': state2, 'agent_3': state3,
    'agent_4': state4, 'agent_5': state5, 'agent_6': state6,
  };

  // n8n WebSocket integration
  const { workflowEvent, connected } = useWorkflowSocket();

  // Notification state
  const [showNotification, setShowNotification]       = useState(false);
  const [completedTaskName, setCompletedTaskName]     = useState('');
  const [lastCompletedAgentId, setLastCompletedAgentId] = useState<string>('agent_1');
  const [recentTasksByAgent, setRecentTasksByAgent]   = useState<Record<string, { name: string; completedAt: string }[]>>({});
  const [workflows, setWorkflows]                   = useState<N8nWorkflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows]     = useState(false);
  const [workflowError, setWorkflowError]           = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId]       = useState('');
  const [assignments, setAssignments]               = useState<Record<string, WorkflowAssignment>>(() => {
    try {
      const raw = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, WorkflowAssignment>) : {};
    } catch {
      return {};
    }
  });
  const [runMessage, setRunMessage]                 = useState<string | null>(null);
  const [runError, setRunError]                     = useState<string | null>(null);
  const [runningWorkflow, setRunningWorkflow]       = useState(false);
  const [enabledWorkflowIds, setEnabledWorkflowIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(ENABLED_WORKFLOWS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [settingsOpen, setSettingsOpen]             = useState(false);
  const [draftEnabledIds, setDraftEnabledIds]       = useState<string[]>([]);
  const [webhookUrls, setWebhookUrls]               = useState<Record<string, string>>(() => {
    try {
      const raw = window.localStorage.getItem(WEBHOOK_URLS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const [draftWebhookUrls, setDraftWebhookUrls]     = useState<Record<string, string>>({});
  const [logEntries, setLogEntries]                 = useState<LogEntry[]>([]);
  const [batchRunOpen, setBatchRunOpen]             = useState(false);
  const [selectedBatchIds, setSelectedBatchIds]     = useState<string[]>([]);
  const [agentStatusOverrides, setAgentStatusOverrides] = useState<Record<string, Agent['status']>>({});
  const logScrollRef = useRef<HTMLDivElement>(null);

  // React to n8n events — route start/complete to the correct agent by agent_id
  useEffect(() => {
    if (!workflowEvent) return;
    const targetState = agentStateMap[workflowEvent.agent_id];
    if (workflowEvent.event === 'start') {
      if (targetState) targetState.trigger(workflowEvent.task_name);
      setAgentStatusOverride(workflowEvent.agent_id, 'running');
      pushLog(`${workflowEvent.agent_id} started "${workflowEvent.task_name}"`, 'info');
    } else if (workflowEvent.event === 'complete') {
      setCompletedTaskName(workflowEvent.task_name);
      setLastCompletedAgentId(workflowEvent.agent_id);
      setRecentTasksByAgent(prev => ({
        ...prev,
        [workflowEvent.agent_id]: [
          { name: workflowEvent.task_name, completedAt: new Date().toISOString() },
          ...(prev[workflowEvent.agent_id] ?? []).slice(0, 3),
        ],
      }));
      if (targetState) targetState.completeWorkflow();
      setAgentStatusOverride(workflowEvent.agent_id, 'idle');
      setShowNotification(true);
      pushLog(`✓ "${workflowEvent.task_name}" complete`, 'success');
    } else if (workflowEvent.event === 'fail') {
      if (targetState) targetState.completeWorkflow();
      setAgentStatusOverride(workflowEvent.agent_id, 'idle');
      setRunError(workflowEvent.error ?? 'Workflow failed');
      pushLog(`✗ "${workflowEvent.task_name}" failed: ${workflowEvent.error ?? 'unknown error'}`, 'error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowEvent]);

  useEffect(() => {
    if (!agents.length) return;
    if (!selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    window.localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    if (!workflows.length) return;
    if (enabledWorkflowIds.length === 0) {
      const hasSaved = window.localStorage.getItem(ENABLED_WORKFLOWS_STORAGE_KEY);
      if (!hasSaved) {
        setEnabledWorkflowIds(workflows.map((workflow) => workflow.id));
      }
    }
  }, [workflows, enabledWorkflowIds.length]);

  useEffect(() => {
    window.localStorage.setItem(ENABLED_WORKFLOWS_STORAGE_KEY, JSON.stringify(enabledWorkflowIds));
  }, [enabledWorkflowIds]);

  useEffect(() => {
    window.localStorage.setItem(WEBHOOK_URLS_STORAGE_KEY, JSON.stringify(webhookUrls));
  }, [webhookUrls]);

  const fetchWorkflows = useCallback(async () => {
    setLoadingWorkflows(true);
    setWorkflowError(null);
    try {
      const response = await fetch('/api/n8n/workflows');
      const payload = (await response.json().catch(() => ({}))) as {
        workflows?: N8nWorkflow[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to fetch workflows');
      }
      setWorkflows(payload.workflows ?? []);
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Unable to reach n8n');
    } finally {
      setLoadingWorkflows(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const pushLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message,
      level,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLogEntries(prev => [...prev.slice(-49), entry]);
  }, []);

  const setAgentStatusOverride = useCallback((agentId: string, status: Agent['status']) => {
    setAgentStatusOverrides(prev => ({ ...prev, [agentId]: status }));
    void updateAgentStatus(agentId, { status });
  }, []);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logEntries]);

  // Auto-fit: ResizeObserver keeps the grid filling ~92% of the container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setAutoFit(Math.max(0.15, Math.min(width / GRID_W, height / GRID_H) * 0.92));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scroll-wheel zoom — non-passive so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      setUserZoom(prev => Math.min(1.6, Math.max(0.7, prev + delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keep pan refs in sync with state so stable closures read current values
  panXRef.current = panX;
  panYRef.current = panY;

  // Mouse-down starts a drag (skip if clicking a button/interactive element)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,select,input,label,option,[data-pan-ignore="true"]')) return;
    e.preventDefault();
    cancelAnimationFrame(dragRef.current.rafId);
    const d = dragRef.current;
    d.active = true;
    d.startMouseX = e.clientX;
    d.startMouseY = e.clientY;
    d.startPanX = panXRef.current;
    d.startPanY = panYRef.current;
    d.velX = 0; d.velY = 0;
    setIsDragging(true);
  }, []);

  // Window-level move + up listeners (captures drags that leave the container)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const newX = d.startPanX + (e.clientX - d.startMouseX);
      const newY = d.startPanY + (e.clientY - d.startMouseY);
      d.velX = newX - panXRef.current;
      d.velY = newY - panYRef.current;
      panXRef.current = newX;
      panYRef.current = newY;
      setPanX(newX);
      setPanY(newY);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      setIsDragging(false);
      // Coast to a stop with exponential velocity decay
      const coast = () => {
        d.velX *= 0.88;
        d.velY *= 0.88;
        if (Math.abs(d.velX) < 0.3 && Math.abs(d.velY) < 0.3) return;
        panXRef.current += d.velX;
        panYRef.current += d.velY;
        setPanX(panXRef.current);
        setPanY(panYRef.current);
        d.rafId = requestAnimationFrame(coast);
      };
      d.rafId = requestAnimationFrame(coast);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []); // stable — only reads from refs

  // Cancel any in-flight inertia rAF on unmount
  useEffect(() => () => cancelAnimationFrame(dragRef.current.rafId), []);

  const finalScale = autoFit * userZoom;

  // Selected agent's state (for button label, run logic, workstation info)
  const currentAgentState = selectedAgentId ? (agentStateMap[selectedAgentId] ?? null) : null;
  const currentPhase = currentAgentState?.runPhase ?? 'idle';
  const currentStageIndex = currentAgentState?.stageIndex ?? 0;
  const currentTotalStages = currentAgentState?.totalStages ?? 0;

  const btnLabel =
    currentPhase === 'idle'       ? 'RUN AGENT' :
    currentPhase === 'working'    ? `WORKING ${currentStageIndex}/${currentTotalStages}` :
    currentPhase === 'done_flash' ? 'DONE ✓' :
    'IN TRANSIT...';

  const btnBg =
    currentPhase === 'idle'       ? BTN_IDLE_BG :
    currentPhase === 'done_flash' ? BTN_DONE_BG :
    BTN_BUSY_BG;

  const btnColor =
    (currentPhase === 'idle' || currentPhase === 'done_flash') ? BTN_IDLE_TEXT : BTN_BUSY_TEXT;
  const n8nOnline = connected && !workflowError;
  const enabledWorkflows = workflows.filter((workflow) => enabledWorkflowIds.includes(workflow.id));

  const currentAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;
  const assignedWorkflow = selectedAgentId ? assignments[selectedAgentId] : undefined;

  const handleAssignWorkflow = useCallback((workflowId: string) => {
    if (!selectedAgentId) return;
    if (!workflowId) {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[selectedAgentId];
        return next;
      });
      setRunMessage('Workflow cleared for selected agent.');
      return;
    }

    const workflow = enabledWorkflows.find((item) => item.id === workflowId);
    if (!workflow) return;
    setAssignments((prev) => ({
      ...prev,
      [selectedAgentId]: { id: workflow.id, name: workflow.name },
    }));
    setRunMessage(`Assigned "${workflow.name}" to ${currentAgent?.name ?? 'agent'}.`);
  }, [selectedAgentId, enabledWorkflows, currentAgent]);

  const handleRunAgent = useCallback(async () => {
    setRunError(null);
    setRunMessage(null);

    if (!currentAgentState || currentAgentState.runPhase !== 'idle') return;
    if (!currentAgent) {
      setRunError('No agent selected.');
      return;
    }
    if (!assignedWorkflow) {
      setRunError('No workflow assigned. Select a workflow first.');
      return;
    }

    setRunningWorkflow(true);
    try {
      const response = await fetch(`/api/n8n/workflows/${assignedWorkflow.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          webhookUrl: webhookUrls[assignedWorkflow.id] ?? '',
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to run workflow');
      }
      currentAgentState.trigger(currentAgent.name);
      setAgentStatusOverride(currentAgent.id, 'running');
      setRunMessage(`Started "${assignedWorkflow.name}".`);
      pushLog(`▶ ${currentAgent.name} started "${assignedWorkflow.name}"`, 'info');
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Failed to run workflow');
    } finally {
      setRunningWorkflow(false);
    }
  }, [currentAgentState, currentAgent, assignedWorkflow, webhookUrls, pushLog]);

  const openSettings = useCallback(() => {
    setDraftEnabledIds(enabledWorkflowIds);
    setDraftWebhookUrls(webhookUrls);
    setSettingsOpen(true);
    fetchWorkflows();
  }, [enabledWorkflowIds, webhookUrls, fetchWorkflows]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const toggleDraftWorkflow = useCallback((workflowId: string) => {
    setDraftEnabledIds((current) => (
      current.includes(workflowId)
        ? current.filter((id) => id !== workflowId)
        : [...current, workflowId]
    ));
  }, []);

  const handleSaveWorkflowSettings = useCallback(() => {
    setEnabledWorkflowIds(draftEnabledIds);
    const trimmedUrls = Object.fromEntries(
      Object.entries(draftWebhookUrls).map(([k, v]) => [k, v.trim().replace(/\/+$/, '')])
    );
    setWebhookUrls(trimmedUrls);
    setSettingsOpen(false);
    if (!selectedAgentId) return;
    const selectedAssignment = assignments[selectedAgentId];
    if (!selectedAssignment) return;
    if (!draftEnabledIds.includes(selectedAssignment.id)) {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[selectedAgentId];
        return next;
      });
      setRunMessage('Assigned workflow was disabled and has been cleared for the selected agent.');
    }
  }, [draftEnabledIds, draftWebhookUrls, selectedAgentId, assignments]);

  // Notification position: above the agent that most recently completed
  const notifAgentTile = (agentStateMap[lastCompletedAgentId] ?? state1).agentTile;
  const { left: agentScreenLeft, top: agentScreenTop } =
    tileToScreen(notifAgentTile.col, notifAgentTile.row, NATURAL_ORIGIN_X, NATURAL_ORIGIN_Y);
  const notifLeft = agentScreenLeft + TILE_W / 2 - NOTIF_W / 2;
  const notifTop  = agentScreenTop  - 90;
  const notifZ    = spriteZIndex(notifAgentTile.col, notifAgentTile.row) + 20;

  const handleDismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const handleCancelAgent = useCallback(async (agentId: string) => {
    const agentState = agentStateMap[agentId];
    const agentName = agents.find(a => a.id === agentId)?.name ?? 'Agent';
    setAgentStatusOverride(agentId, 'cancelling');
    try {
      await fetch(`/api/cancel/${agentId}`, { method: 'POST' });
      agentState?.completeWorkflow();
      setAgentStatusOverride(agentId, 'idle');
      setRunMessage('Workflow cancelled');
      pushLog(`⚠ ${agentName}: workflow cancelled by user`, 'warn');
    } catch (error) {
      console.error('Cancel failed:', error);
      setAgentStatusOverride(agentId, 'running');
    }
  }, [agentStateMap, agents, setAgentStatusOverride, pushLog]);

  const handleBatchRun = useCallback(async () => {
    setBatchRunOpen(false);
    const ids = selectedBatchIds.filter(id => {
      const agentState = agentStateMap[id];
      const assignment = assignments[id];
      return agentState?.runPhase === 'idle' && !!assignment && !!(webhookUrls[assignment.id] ?? '');
    });
    if (!ids.length) { setSelectedBatchIds([]); return; }
    pushLog(`▶▶ Batch run started: ${ids.length} agent${ids.length !== 1 ? 's' : ''}`, 'info');
    await Promise.allSettled(ids.map(async (agentId) => {
      const agent = agents.find(a => a.id === agentId);
      const agentState = agentStateMap[agentId];
      const assignment = assignments[agentId];
      if (!agent || !agentState || !assignment) return;
      const wUrl = webhookUrls[assignment.id] ?? '';
      const response = await fetch(`/api/n8n/workflows/${assignment.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, agentName: agent.name, webhookUrl: wUrl }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        pushLog(`✗ Failed to start ${agent.name}: ${payload.error ?? 'error'}`, 'error');
        return;
      }
      agentState.trigger(agent.name);
    }));
    setSelectedBatchIds([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatchIds, agents, assignments, webhookUrls, pushLog]);

  // Merge fetched agents with local status overrides for immediate UI feedback
  const agentsWithStatus = agents.map(a =>
    agentStatusOverrides[a.id] ? { ...a, status: agentStatusOverrides[a.id]! } : a
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: BG_SKY,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* ── Ambient glow pools ── */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <div style={{
          position: 'absolute', left: '-5%', bottom: '-5%',
          width: '50%', height: '50%', borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${GLOW_WARM} 0%, transparent 65%)`,
        }} />
        <div style={{
          position: 'absolute', right: '-5%', top: '-5%',
          width: '50%', height: '50%', borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${GLOW_COOL} 0%, transparent 65%)`,
        }} />
      </div>

      {/* ── Room shadow ── */}
      <div aria-hidden="true" style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(calc(-50% + ${panX}px), calc(-38% + ${panY}px)) scale(${finalScale})`,
        width: GRID_W * 0.72, height: GRID_H * 0.45,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.10)',
        filter: 'blur(48px)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* ── Grid transform layer ── */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${finalScale})`,
        transformOrigin: 'center center',
        width: GRID_W, height: GRID_H,
        zIndex: 3,
      }}>

        {/* Floor tiles */}
        <OfficeFloor originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} />

        {/* Walls + decorations */}
        <OfficeWalls originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} />

        {/* Fish tank — large, against break room left wall */}
        <FishTank col={1} row={8} originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} />

        {/* Break room furniture (reorganized along walls) */}
        {BREAKROOM_FURNITURE.map((f) => (
          <IsoBox
            key={`br-${f.col}-${f.row}-${f.variant}`}
            {...f}
            originX={NATURAL_ORIGIN_X}
            originY={NATURAL_ORIGIN_Y}
          />
        ))}

        {/* Plant sprites (scattered around office) */}
        <PlantSprite col={3}  row={3}  originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} size="tall" />
        <PlantSprite col={20} row={3}  originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} size="tall" />
        <PlantSprite col={15} row={4}  originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} size="medium" />
        <PlantSprite col={9}  row={7}  originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} size="small" />
        <PlantSprite col={19} row={5}  originX={NATURAL_ORIGIN_X} originY={NATURAL_ORIGIN_Y} size="small" />

        {/* 6 workstations — each gets state from its corresponding agent */}
        {WORKSTATIONS.map((ws, i) => {
          const wsState = allAgentStates[i]?.workstationState ?? 'idle';
          return (
            <Workstation
              key={ws.label}
              label={ws.label}
              col={ws.col}
              row={ws.row}
              originX={NATURAL_ORIGIN_X}
              originY={NATURAL_ORIGIN_Y}
              color={ws.color}
              chairColor={ws.chairColor}
              deskItem={ws.deskItem}
              isActiveStation={wsState !== 'idle'}
              state={wsState}
            />
          );
        })}

        {/* 6 agent sprites — each independent */}
        {allAgentStates.map((st, i) => {
          const vc = AGENT_VISUAL_CONFIGS[i];
          const agentId = `agent_${i + 1}`;
          return (
            <AgentSprite
              key={agentId}
              col={st.agentTile.col}
              row={st.agentTile.row}
              originX={NATURAL_ORIGIN_X}
              originY={NATURAL_ORIGIN_Y}
              stageIndex={st.stageIndex}
              totalStages={st.totalStages}
              color={vc.bodyColor}
              agentName={`AGENT ${i + 1}`}
              hairColor={vc.hairColor}
              skinColor={vc.skinColor}
              hasGlasses={'hasGlasses' in vc ? vc.hasGlasses : false}
              hasHeadphones={'hasHeadphones' in vc ? vc.hasHeadphones : false}
              hasCap={'hasCap' in vc ? vc.hasCap : false}
              hasBeard={'hasBeard' in vc ? vc.hasBeard : false}
              taskName={st.currentTaskName || undefined}
              startedAt={st.startedAt}
              recentTasks={recentTasksByAgent[agentId] ?? []}
            />
          );
        })}

        {/* Black cat — wanders autonomously around office + break room */}
        <CatSprite
          col={cat.catTile.col}
          row={cat.catTile.row}
          originX={NATURAL_ORIGIN_X}
          originY={NATURAL_ORIGIN_Y}
          isWalking={cat.isWalking}
          isSitting={cat.isSitting}
          facingLeft={cat.facingLeft}
        />

        {/* Completion notification — follows agent, click to dismiss */}
        {showNotification && (
          <div
            className="animate-notif-appear"
            style={{
              position: 'absolute',
              left: notifLeft,
              top: notifTop,
              width: NOTIF_W,
              zIndex: notifZ,
              cursor: 'pointer',
            }}
            onClick={handleDismissNotification}
          >
            <div style={{
              background: '#0C1A0E',
              border: '2px solid #34D39966',
              borderRadius: 10,
              padding: '6px 10px 7px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.75), 0 0 12px rgba(52,211,153,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, color: '#34D399', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>✓ COMPLETE</span>
              </div>
              <span style={{
                fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
                color: '#A8DEC0', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}>
                {completedTaskName}
              </span>
              <span style={{ fontSize: 6, fontFamily: 'JetBrains Mono, monospace', color: '#3A5A42', letterSpacing: '0.08em' }}>
                CLICK TO DISMISS
              </span>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #34D39966', margin: '0 auto', marginTop: -1 }} />
            <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #0C1A0E', margin: '0 auto', marginTop: -8 }} />
          </div>
        )}
      </div>

      {/* ── Vignette ── */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.08) 90%)',
        pointerEvents: 'none',
        zIndex: 9000,
      }} />

      {/* ── WebSocket status indicator ── */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 5,
        zIndex: 9002, pointerEvents: 'none',
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: n8nOnline ? '#34D399' : '#EF4444',
          boxShadow: n8nOnline ? '0 0 5px #34D399' : '0 0 5px #EF4444',
        }} />
        <span style={{
          fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
          color: n8nOnline ? '#34D399' : '#EF4444',
          letterSpacing: '0.10em',
        }}>
          {n8nOnline ? 'N8N LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* ── Workflow assignment controls ── */}
      <div
        data-pan-ignore="true"
        style={{
          position: 'absolute',
          right: 36,
          bottom: 92,
          zIndex: 9002,
          width: 330,
          background: 'rgba(12,12,18,0.9)',
          border: '1px solid #1E1E2E',
          borderRadius: 8,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxShadow: '0 6px 22px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 2 }}>
          <button
            type="button"
            onClick={() => {
              const eligible = agents
                .filter((a, i) => allAgentStates[i]?.runPhase === 'idle' && !!assignments[a.id] && !!(webhookUrls[assignments[a.id]?.id ?? ''] ?? ''))
                .map(a => a.id);
              setSelectedBatchIds(eligible);
              setBatchRunOpen(true);
            }}
            title="Batch Run — start multiple agents at once"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              lineHeight: 1,
              background: '#151522',
              color: '#A7A7C8',
              border: '1px solid #2A2A3A',
              borderRadius: 5,
              padding: '4px 7px',
              cursor: 'pointer',
            }}
          >
            ▶▶
          </button>
          <button
            type="button"
            onClick={openSettings}
            title="Workflow Settings"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              lineHeight: 1,
              background: '#151522',
              color: '#A7A7C8',
              border: '1px solid #2A2A3A',
              borderRadius: 5,
              padding: '4px 7px',
              cursor: 'pointer',
            }}
          >
            ⚙
          </button>
        </div>
        <label
          style={{
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#8888AA',
            letterSpacing: '0.1em',
          }}
        >
          SELECT AGENT
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 164, overflowY: 'auto' }}>
          {agentsWithStatus.map((agent, i) => {
            const phase = allAgentStates[i]?.runPhase ?? 'idle';
            const isSelected = agent.id === selectedAgentId;
            const dotColor =
              phase === 'working' ? '#34D399' :
              phase === 'walk_out' || phase === 'walk_back' ? '#F59E0B' :
              '#3A3A5A';
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? '#3A3A5A' : 'transparent'}`,
                  background: isSelected ? '#1A1A2E' : '#0F0F17',
                  position: 'relative',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#1A1A28';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#0F0F17';
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#F0F0F0', flex: 1 }}>
                  {agent.name}
                </span>
                {agent.status === 'running' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleCancelAgent(agent.id); }}
                    title="Cancel workflow"
                    style={{
                      width: 16,
                      height: 16,
                      background: '#ff3b30',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      fontSize: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: 0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ff1f1f'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ff3b30'; }}
                  >
                    ✕
                  </button>
                )}
                {agent.status === 'cancelling' && (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#F59E0B', opacity: 0.7 }}>
                    …
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <label
          style={{
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#8888AA',
            letterSpacing: '0.1em',
          }}
        >
          ASSIGN WORKFLOW
        </label>
        <select
          value={assignedWorkflow?.id ?? ''}
          onChange={(event) => handleAssignWorkflow(event.target.value)}
          disabled={loadingWorkflows || !selectedAgentId}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            background: '#0F0F17',
            color: '#F0F0F0',
            border: '1px solid #2A2A3A',
            borderRadius: 6,
            padding: '7px 8px',
            opacity: loadingWorkflows ? 0.6 : 1,
          }}
        >
          <option value="">Select Workflow</option>
          {enabledWorkflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#4A4A6A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={assignedWorkflow ? `${currentAgent?.name}: ${assignedWorkflow.name}` : 'No workflow assigned'}
          >
            {assignedWorkflow ? `Assigned: ${assignedWorkflow.name}` : 'Assigned: none'}
          </span>
          <button
            type="button"
            onClick={fetchWorkflows}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              background: '#151522',
              color: '#F5A623',
              border: '1px solid #3A2E15',
              borderRadius: 5,
              padding: '5px 8px',
              cursor: 'pointer',
            }}
          >
            {loadingWorkflows ? 'LOADING...' : 'REFRESH'}
          </button>
        </div>

        {workflowError ? (
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#EF4444' }}>
            {workflowError}
          </span>
        ) : null}
        {runError ? (
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#EF4444' }}>
            {runError}
          </span>
        ) : null}
        {runMessage ? (
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#34D399' }}>
            {runMessage}
          </span>
        ) : null}
      </div>

      {settingsOpen ? (
        <div
          data-pan-ignore="true"
          onClick={closeSettings}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 9500,
            background: 'rgba(4,4,10,0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(560px, 92vw)',
              maxHeight: '80vh',
              background: '#0F0F17',
              border: '1px solid #2A2A3A',
              borderRadius: 10,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #232338',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#F0F0F0' }}>
                Workflow Settings
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={fetchWorkflows}
                  disabled={loadingWorkflows}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    background: '#151522',
                    color: loadingWorkflows ? '#555570' : '#A7A7C8',
                    border: '1px solid #2A2A3A',
                    borderRadius: 5,
                    padding: '4px 8px',
                    cursor: loadingWorkflows ? 'default' : 'pointer',
                  }}
                >
                  {loadingWorkflows ? 'LOADING...' : 'REFRESH'}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftEnabledIds(workflows.map((workflow) => workflow.id))}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    background: '#151522',
                    color: '#A7A7C8',
                    border: '1px solid #2A2A3A',
                    borderRadius: 5,
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setDraftEnabledIds([])}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    background: '#151522',
                    color: '#A7A7C8',
                    border: '1px solid #2A2A3A',
                    borderRadius: 5,
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div style={{ padding: 16, overflowY: 'auto', display: 'grid', gap: 8 }}>
              {loadingWorkflows && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#555570', padding: '8px 0' }}>
                  Loading workflows...
                </div>
              )}
              {!loadingWorkflows && workflowError && workflows.length === 0 && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#EF4444', padding: '8px 0' }}>
                  {workflowError}
                </div>
              )}
              {!loadingWorkflows && !workflowError && workflows.length === 0 && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#555570', padding: '8px 0' }}>
                  No workflows found. Add workflows in n8n then click REFRESH.
                </div>
              )}
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    border: '1px solid #24243A',
                    borderRadius: 8,
                    background: '#12121C',
                    padding: '8px 10px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={draftEnabledIds.includes(workflow.id)}
                      onChange={() => toggleDraftWorkflow(workflow.id)}
                      style={{ width: 14, height: 14, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 11, color: '#E3E3F7' }}>{workflow.name}</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Webhook URL (e.g. http://localhost:5678/webhook/...)"
                    value={draftWebhookUrls[workflow.id] ?? ''}
                    onChange={(e) => setDraftWebhookUrls((prev) => ({ ...prev, [workflow.id]: e.target.value }))}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      background: '#0E0E1A',
                      color: '#A7A7C8',
                      border: '1px solid #2A2A3A',
                      borderRadius: 4,
                      padding: '4px 8px',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                padding: 16,
                borderTop: '1px solid #232338',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={closeSettings}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  background: '#151522',
                  color: '#A7A7C8',
                  border: '1px solid #2A2A3A',
                  borderRadius: 6,
                  padding: '7px 12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkflowSettings}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  background: '#1B2A1E',
                  color: '#34D399',
                  border: '1px solid #245B45',
                  borderRadius: 6,
                  padding: '7px 12px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Run Agent button ── */}
      <button
        onClick={() => {
          if (currentPhase === 'working') {
            currentAgentState?.completeWorkflow();
            return;
          }
          void handleRunAgent();
        }}
        disabled={
          runningWorkflow ||
          currentPhase === 'walk_out' ||
          currentPhase === 'walk_back' ||
          currentPhase === 'done_flash'
        }
        style={{
          position: 'absolute', bottom: 36, right: 36,
          zIndex: 9002,
          padding: '8px 18px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          fontWeight: 600,
          background: btnBg,
          color: btnColor,
          border: `1px solid ${currentPhase === 'idle' ? BTN_IDLE_BG + '88' : 'rgba(0,0,0,0.12)'}`,
          borderRadius: 6,
          cursor: (currentPhase === 'idle' || currentPhase === 'working') ? 'pointer' : 'default',
          transition: 'background 0.4s ease, color 0.4s ease, border-color 0.4s ease',
          userSelect: 'none',
          boxShadow: currentPhase === 'idle' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {runningWorkflow ? 'STARTING...' : currentPhase === 'working' ? 'FINISH ✓' : btnLabel}
      </button>

      {/* ── Live Log panel ── */}
      <div
        data-pan-ignore="true"
        style={{
          position: 'absolute',
          left: 36,
          bottom: 36,
          zIndex: 9002,
          width: 280,
          background: 'rgba(12,12,18,0.9)',
          border: '1px solid #1E1E2E',
          borderRadius: 8,
          boxShadow: '0 6px 22px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #1E1E2E', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? '#34D399' : '#EF4444',
            boxShadow: connected ? '0 0 4px #34D399' : 'none',
          }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#8888AA', letterSpacing: '0.1em' }}>
            LIVE LOG
          </span>
        </div>
        <div
          ref={logScrollRef}
          style={{ maxHeight: 180, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {logEntries.length === 0 ? (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3A3A5A' }}>
              No events yet...
            </span>
          ) : (
            logEntries.map(entry => (
              <div key={entry.id} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#4A4A6A', flexShrink: 0, marginTop: 1 }}>
                  {entry.timestamp}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  color: entry.level === 'success' ? '#34D399'
                       : entry.level === 'error'   ? '#EF4444'
                       : entry.level === 'warn'    ? '#F5A623'
                       : '#A7A7C8',
                }}>
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Batch Run modal ── */}
      {batchRunOpen ? (
        <div
          data-pan-ignore="true"
          onClick={() => setBatchRunOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 9500,
            background: 'rgba(4,4,10,0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(400px, 90vw)',
              background: '#0F0F17',
              border: '1px solid #2A2A3A',
              borderRadius: 10,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              padding: 20,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#F0F0F0' }}>
              Batch Run
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#6A6A8A' }}>
              Select agents to start simultaneously. Only idle agents with a workflow and webhook URL assigned are eligible.
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agentsWithStatus.map((agent, i) => {
                const agentState = allAgentStates[i];
                const assignment = assignments[agent.id];
                const hasWebhook = !!assignment && !!(webhookUrls[assignment.id] ?? '');
                const canRun = agentState?.runPhase === 'idle' && !!assignment && hasWebhook;
                const isSelected = selectedBatchIds.includes(agent.id);
                return (
                  <label
                    key={agent.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: canRun ? 'pointer' : 'default', opacity: canRun ? 1 : 0.35 }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canRun}
                      onChange={() => setSelectedBatchIds(prev =>
                        prev.includes(agent.id) ? prev.filter(id => id !== agent.id) : [...prev, agent.id]
                      )}
                      style={{ width: 14, height: 14, cursor: canRun ? 'pointer' : 'default' }}
                    />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#E3E3F7' }}>
                      {agent.name}
                    </span>
                    {assignment ? (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#6A6A8A' }}>
                        → {assignment.name}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4A4A6A' }}>
                        (no workflow)
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setBatchRunOpen(false)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  background: '#151522', color: '#A7A7C8', border: '1px solid #2A2A3A',
                  borderRadius: 6, padding: '7px 12px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void handleBatchRun(); }}
                disabled={selectedBatchIds.length === 0}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  background: selectedBatchIds.length > 0 ? '#1B2A1E' : '#151520',
                  color: selectedBatchIds.length > 0 ? '#34D399' : '#3A3A5A',
                  border: `1px solid ${selectedBatchIds.length > 0 ? '#245B45' : '#2A2A3A'}`,
                  borderRadius: 6, padding: '7px 12px',
                  cursor: selectedBatchIds.length > 0 ? 'pointer' : 'default',
                }}
              >
                Start All ({selectedBatchIds.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Grid label ── */}
      <div style={{
        position: 'absolute', bottom: 14, left: 16,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        color: GRID_LABEL,
        letterSpacing: '0.15em',
        pointerEvents: 'none',
        zIndex: 9001,
      }}>
        GBOT COMMAND CENTER · OFFICE GRID 22×16
      </div>
    </div>
  );
}
