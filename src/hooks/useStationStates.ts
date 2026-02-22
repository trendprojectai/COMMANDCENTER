// src/hooks/useStationStates.ts
// Agent movement + work state machine.
// Supports indefinite work mode — agent stays at desk until completeWorkflow() is called.
import { useState, useRef, useCallback, useEffect } from 'react';

export type RunPhase = 'idle' | 'walk_out' | 'working' | 'walk_back' | 'done_flash';
export type StationState = 'idle' | 'active' | 'done' | 'error';

export interface StationConfig {
  workstationCol: number; // destination desk column (8, 10, 12, 14, 16, or 18)
  idleCol: number;        // idle tile column (agent-specific)
  idleRow: number;        // idle tile row (agent-specific)
}

export interface UseStationStatesReturn {
  runPhase: RunPhase;
  agentTile: { col: number; row: number };
  workstationState: StationState;
  stageIndex: number;
  totalStages: number;
  trigger: (taskName?: string) => void;
  completeWorkflow: () => void;
  currentTaskName: string;
  startedAt: number | null;
}

const STEP_MS       = 700;  // ms between waypoint moves (CSS transition 600ms + 100ms buffer)
const WORK_STAGES   = 10;   // visual progress increments (capped at 9 until completeWorkflow)
const WORK_STAGE_MS = 2000; // ms per visual progress stage (slower — workflow can take any duration)
const DONE_FLASH_MS = 2000; // ms for done flash before returning to idle

export function useStationStates(config: StationConfig): UseStationStatesReturn {
  // ── Waypoints: agent idle position → workstation desk ─────────────────────
  // 8-step path navigating around the furniture layout.
  // Steps 1-5 are shared corridor path; steps 0, 6, 7 are agent-specific.
  const waypoints = [
    { col: config.idleCol,        row: config.idleRow }, // 0: idle position (agent-specific)
    { col: 4,                     row: 12             }, // 1: step off rug, past beanbags
    { col: 5,                     row: 11             }, // 2: past pool table / left edge
    { col: 6,                     row: 10             }, // 3: corridor entry
    { col: 6,                     row: 8              }, // 4: past fish tank level
    { col: 7,                     row: 6              }, // 5: office entry
    { col: config.workstationCol, row: 4              }, // 6: approaching workstation row (agent-specific)
    { col: config.workstationCol, row: 1              }, // 7: at desk (agent-specific)
  ];

  const [runPhase, setRunPhase]       = useState<RunPhase>('idle');
  const [waypointIdx, setWaypointIdx] = useState(0);
  const [workStage, setWorkStage]     = useState(0);
  const [currentTaskName, setCurrentTaskName] = useState('');
  const [startedAt, setStartedAt]     = useState<number | null>(null);

  const isRunningRef   = useRef(false);
  const timersRef      = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isWorkingRef   = useRef(false); // true while in 'working' phase
  const workTimersRef  = useRef<ReturnType<typeof setTimeout>[]>([]); // work-stage timers only

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      workTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const addTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
    return t;
  };

  const addWorkTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    workTimersRef.current.push(t);
    return t;
  };

  const startWalkBack = useCallback(() => {
    // Clear any pending work-stage timers
    workTimersRef.current.forEach(clearTimeout);
    workTimersRef.current = [];
    isWorkingRef.current = false;

    setRunPhase('walk_back');
    setWorkStage(0);

    // Walk back: desk → approaching row → office entry → corridor → fish tank → corridor entry → past pool → rug
    addTimer(() => setWaypointIdx(6), STEP_MS);
    addTimer(() => setWaypointIdx(5), STEP_MS * 2);
    addTimer(() => setWaypointIdx(4), STEP_MS * 3);
    addTimer(() => setWaypointIdx(3), STEP_MS * 4);
    addTimer(() => setWaypointIdx(2), STEP_MS * 5);
    addTimer(() => setWaypointIdx(1), STEP_MS * 6);
    addTimer(() => {
      setWaypointIdx(0);
      setRunPhase('done_flash');
    }, STEP_MS * 7);

    addTimer(() => {
      setRunPhase('idle');
      setStartedAt(null);
      isRunningRef.current = false;
    }, STEP_MS * 7 + DONE_FLASH_MS);
  }, []);

  const completeWorkflow = useCallback(() => {
    if (!isWorkingRef.current) return;
    // Snap progress to full, then walk back
    setWorkStage(WORK_STAGES);
    setTimeout(() => startWalkBack(), 600);
  }, [startWalkBack]);

  const trigger = useCallback((taskName?: string) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    isWorkingRef.current = false;

    // Clear any stale timers
    timersRef.current.forEach(clearTimeout);
    workTimersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    workTimersRef.current = [];

    // Store task info
    setCurrentTaskName(taskName ?? '');
    setStartedAt(Date.now());
    setWorkStage(0);
    setWaypointIdx(0);
    setRunPhase('walk_out');

    // ── Walk out: idle → desk (8 waypoints, STEP_MS each) ──────────────────
    for (let i = 1; i < waypoints.length - 1; i++) {
      addTimer(() => setWaypointIdx(i), STEP_MS * i);
    }
    // Final step: arrive at desk, switch to working
    addTimer(() => {
      setWaypointIdx(waypoints.length - 1);
      setRunPhase('working');
      isWorkingRef.current = true;

      // ── Visual progress: increments slowly, caps at 9/10 until completeWorkflow ──
      for (let s = 1; s < WORK_STAGES; s++) {
        addWorkTimer(() => {
          setWorkStage(prev => Math.min(prev + 1, WORK_STAGES - 1));
        }, s * WORK_STAGE_MS);
      }
    }, STEP_MS * (waypoints.length - 1));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const agentTile = waypoints[waypointIdx];

  const workstationState: StationState =
    runPhase === 'working'                                    ? 'active' :
    runPhase === 'walk_back' || runPhase === 'done_flash'     ? 'done'   :
    'idle';

  const stageIndex  = runPhase === 'working' ? workStage : 0;
  const totalStages = runPhase === 'working' ? WORK_STAGES : 0;

  return {
    runPhase,
    agentTile,
    workstationState,
    stageIndex,
    totalStages,
    trigger,
    completeWorkflow,
    currentTaskName,
    startedAt,
  };
}
