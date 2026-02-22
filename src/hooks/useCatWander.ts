// src/hooks/useCatWander.ts
// Black cat wandering state machine.
// Cat roams randomly between curated walkable tiles across the office + break room.
import { useState, useRef, useEffect } from 'react';

// Slightly slower than before so the cat reads as "slinking" rather than robot-stepping.
const STEP_MS   = 320;  // ms per tile step (faster than agents at 700ms)
const REST_MIN  = 1500; // min rest at destination (ms)
const REST_MAX  = 5000; // max rest at destination (ms)
const SIT_CHANCE = 0.6; // probability of sitting pose while resting

// Curated walkable waypoints — avoid furniture footprints and wall tiles.
const WALKABLE_TILES = [
  // Break room — left open space
  { col: 1, row: 10 }, { col: 1, row: 11 }, { col: 1, row: 12 },
  { col: 1, row: 13 }, { col: 2, row: 10 }, { col: 2, row: 11 },
  { col: 2, row: 12 }, { col: 2, row: 13 }, { col: 2, row: 14 },
  // Break room — center/right open space
  { col: 3, row: 10 }, { col: 3, row: 11 }, { col: 3, row: 13 },
  { col: 5, row: 11 }, { col: 5, row: 12 }, { col: 5, row: 13 },
  { col: 6, row: 11 }, { col: 6, row: 12 },
  // Corridor transition
  { col: 6, row: 9  }, { col: 6, row: 8  },
  { col: 7, row: 9  }, { col: 7, row: 7  }, { col: 7, row: 6  },
  // Office — between desks and back wall
  { col: 9,  row: 3 }, { col: 9,  row: 4 }, { col: 9,  row: 5 },
  { col: 10, row: 5 }, { col: 11, row: 4 }, { col: 11, row: 5 },
  { col: 12, row: 5 }, { col: 13, row: 4 }, { col: 13, row: 5 },
  { col: 14, row: 5 }, { col: 15, row: 4 }, { col: 15, row: 5 },
  { col: 16, row: 5 }, { col: 17, row: 5 },
];

function computePath(
  from: { col: number; row: number },
  to:   { col: number; row: number },
): Array<{ col: number; row: number }> {
  const path: Array<{ col: number; row: number }> = [];
  let { col, row } = from;

  const moveCols = () => {
    while (col !== to.col) {
      col += col < to.col ? 1 : -1;
      path.push({ col, row });
    }
  };
  const moveRows = () => {
    while (row !== to.row) {
      row += row < to.row ? 1 : -1;
      path.push({ col, row });
    }
  };

  // Randomly choose cols-first or rows-first for variety
  if (Math.random() < 0.5) { moveCols(); moveRows(); }
  else                      { moveRows(); moveCols(); }

  return path;
}

export interface UseCatWanderReturn {
  catTile:    { col: number; row: number };
  isWalking:  boolean;
  isSitting:  boolean;
  facingLeft: boolean;
}

export function useCatWander(): UseCatWanderReturn {
  const [catTile,    setCatTile]    = useState({ col: 3, row: 11 });
  const [isWalking,  setIsWalking]  = useState(false);
  const [isSitting,  setIsSitting]  = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);

  // Refs for stable values accessible inside timer callbacks
  const catTileRef = useRef({ col: 3, row: 11 });

  useEffect(() => {
    // Local timer list for clean cleanup on unmount
    const timers: ReturnType<typeof setTimeout>[] = [];
    function addTimer(fn: () => void, delay: number) {
      const t = setTimeout(fn, delay);
      timers.push(t);
      return t;
    }

    function startWander() {
      const current = catTileRef.current;
      const options = WALKABLE_TILES.filter(
        t => t.col !== current.col || t.row !== current.row,
      );
      const dest = options[Math.floor(Math.random() * options.length)];
      const path = computePath(current, dest);

      if (path.length === 0) {
        // Already at destination — just rest
        setIsWalking(false);
        setIsSitting(Math.random() < SIT_CHANCE);
        addTimer(startWander, REST_MIN + Math.random() * (REST_MAX - REST_MIN));
        return;
      }

      setIsWalking(true);
      setIsSitting(false);

      // Schedule each tile step
      path.forEach((tile, idx) => {
        addTimer(() => {
          // Update facing direction based on column delta
          const prevTile = idx === 0 ? current : path[idx - 1];
          if      (tile.col < prevTile.col) setFacingLeft(true);
          else if (tile.col > prevTile.col) setFacingLeft(false);

          catTileRef.current = tile;
          setCatTile({ col: tile.col, row: tile.row });
        }, STEP_MS * (idx + 1));
      });

      // After final step: stop, rest, then pick next destination
      addTimer(() => {
        setIsWalking(false);
        setIsSitting(Math.random() < SIT_CHANCE);
        addTimer(startWander, REST_MIN + Math.random() * (REST_MAX - REST_MIN));
      }, STEP_MS * path.length + 60);
    }

    // Initial delay before first wander (stagger from load)
    addTimer(startWander, 500 + Math.random() * 1000);

    return () => timers.forEach(clearTimeout);
  }, []); // run once on mount

  return { catTile, isWalking, isSitting, facingLeft };
}
