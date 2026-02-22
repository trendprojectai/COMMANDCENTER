// src/components/office/Workstation.tsx
// Isometric 3-face desk box with monitor, chair, personal desk item, and
// an optional active-station pulsing ring (for WS-01).

import { useState } from 'react';
import { tileToScreen, objectZIndex, tileZIndex, TILE_W, TILE_H, BOX_H } from '../../utils/isometric';
import type { StationState } from '../../hooks/useStationStates';
import {
  DESK_TOP_IDLE,
  DESK_LEFT_IDLE,
  DESK_RIGHT_IDLE,
  DESK_LABEL_IDLE,
  DESK_LABEL_ACTIVE,
  MONITOR_IDLE_BG,
  MONITOR_IDLE_BORDER,
  TOOLTIP_BG,
  tooltipBorder,
  PLANT_POT,
  PLANT_POT_SHADOW,
  PLANT_LEAF_MID,
} from '../../utils/habboColors';

export type DeskItemType = 'plant' | 'mug' | 'frame' | 'ball' | 'figure' | 'papers';

interface WorkstationProps {
  label: string;
  col: number;
  row: number;
  originX: number;
  originY: number;
  state: StationState;
  color: string;
  chairColor?: string;
  deskItem?: DeskItemType;
  isActiveStation?: boolean;
}

/** Parse 6-digit hex color → rgba() string */
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Desk item decorations ─────────────────────────────────────────────────────

function DeskItemDecoration({ item }: { item: DeskItemType }) {
  // Positioned in the upper-right quadrant of the desk top face so it
  // doesn't occlude the monitor area (monitor sits center-left on top face).
  const base: React.CSSProperties = { position: 'absolute' };

  switch (item) {
    case 'plant':
      return (
        <>
          {/* Small pot */}
          <div style={{ ...base, left: TILE_W / 2 + 4, top: TILE_H / 4 + 2, width: 6, height: 5, background: PLANT_POT, borderRadius: '0 0 2px 2px', border: `1px solid ${PLANT_POT_SHADOW}` }} />
          {/* Foliage blob */}
          <div style={{ ...base, left: TILE_W / 2 + 2, top: TILE_H / 4 - 3, width: 8, height: 8, borderRadius: '50%', background: PLANT_LEAF_MID, border: '1px solid #1A5A2A' }} />
        </>
      );
    case 'mug':
      return (
        <>
          {/* Mug body */}
          <div style={{ ...base, left: TILE_W / 2 + 5, top: TILE_H / 4, width: 6, height: 7, background: '#E8E0D0', borderRadius: '1px 1px 2px 2px', border: '1px solid #CCC0B0' }} />
          {/* Handle */}
          <div style={{ ...base, left: TILE_W / 2 + 10, top: TILE_H / 4 + 2, width: 2, height: 3, border: '1px solid #CCC0B0', borderLeft: 'none', borderRadius: '0 2px 2px 0' }} />
          {/* Steam */}
          <div style={{ ...base, left: TILE_W / 2 + 7, top: TILE_H / 4 - 2, width: 2, height: 2, background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
        </>
      );
    case 'frame':
      return (
        <div style={{
          ...base,
          left: TILE_W / 2 + 4,
          top: TILE_H / 4,
          width: 8,
          height: 7,
          background: '#FFFDF5',
          border: '2px solid #8866AA',
          borderRadius: 1,
        }}>
          {/* Photo tint */}
          <div style={{ position: 'absolute', inset: 1, background: 'rgba(100,150,200,0.3)', borderRadius: 1 }} />
        </div>
      );
    case 'ball':
      return (
        <div style={{
          ...base,
          left: TILE_W / 2 + 6,
          top: TILE_H / 4 + 1,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FF8888, #CC2222)',
          boxShadow: '1px 1px 2px rgba(0,0,0,0.2)',
        }} />
      );
    case 'figure':
      return (
        <>
          {/* Body */}
          <div style={{ ...base, left: TILE_W / 2 + 6, top: TILE_H / 4 + 2, width: 4, height: 5, background: '#4488DD', borderRadius: '2px 2px 0 0' }} />
          {/* Head */}
          <div style={{ ...base, left: TILE_W / 2 + 7, top: TILE_H / 4 - 1, width: 4, height: 4, borderRadius: '50%', background: '#FFCC88' }} />
        </>
      );
    case 'papers':
      return (
        <>
          <div style={{ ...base, left: TILE_W / 2 + 3, top: TILE_H / 4 + 1, width: 10, height: 7, background: '#FFFFF0', border: '1px solid #E0E0D0', borderRadius: 1 }} />
          {/* Lines */}
          <div style={{ ...base, left: TILE_W / 2 + 5, top: TILE_H / 4 + 3, width: 6, height: 1, background: 'rgba(0,0,0,0.12)' }} />
          <div style={{ ...base, left: TILE_W / 2 + 5, top: TILE_H / 4 + 5, width: 4, height: 1, background: 'rgba(0,0,0,0.10)' }} />
        </>
      );
    default:
      return null;
  }
}

// ── Chair component ───────────────────────────────────────────────────────────

interface ChairProps {
  col: number;
  row: number;    // desk row; chair renders at row-1
  originX: number;
  originY: number;
  color: string;
}

function Chair({ col, row, originX, originY, color }: ChairProps) {
  const chairRow = row - 1; // one tile "behind" desk (closer to back wall)
  const { left: tileLeft, top: tileTop } = tileToScreen(col, chairRow, originX, originY);
  // Z: sits on top of the floor tile at this position, below the agent body
  const z = tileZIndex(col, chairRow) + 50;

  // Seat: small isometric diamond (50% of tile size)
  const SEAT_W = Math.round(TILE_W * 0.55);
  const SEAT_H = Math.round(TILE_H * 0.55);
  const BACK_H = 10; // chair back rest height in px
  const SEAT_BOX_H = 8;

  // Center the seat on the tile
  const offsetX = Math.round((TILE_W - SEAT_W) / 2);
  const left = tileLeft + offsetX;
  const top  = tileTop  - SEAT_BOX_H + Math.round((TILE_H - SEAT_H) / 2);

  const cH = SEAT_H + SEAT_BOX_H;

  // Chair seat clip-paths (scaled down)
  const topClip   = `polygon(${SEAT_W / 2}px 0px, ${SEAT_W}px ${SEAT_H / 2}px, ${SEAT_W / 2}px ${SEAT_H}px, 0px ${SEAT_H / 2}px)`;
  const leftClip  = `polygon(0px ${SEAT_H / 2}px, ${SEAT_W / 2}px ${SEAT_H}px, ${SEAT_W / 2}px ${cH}px, 0px ${SEAT_H / 2 + SEAT_BOX_H}px)`;
  const rightClip = `polygon(${SEAT_W / 2}px ${SEAT_H}px, ${SEAT_W}px ${SEAT_H / 2}px, ${SEAT_W}px ${SEAT_H / 2 + SEAT_BOX_H}px, ${SEAT_W / 2}px ${cH}px)`;

  // Chair back rest — thin vertical bar behind seat
  const backTop = top - BACK_H;

  return (
    <>
      {/* Chair back rest */}
      <div
        style={{
          position: 'absolute',
          left: left + Math.round(SEAT_W * 0.2),
          top: backTop,
          width: Math.round(SEAT_W * 0.6),
          height: BACK_H + 4,
          background: color,
          borderRadius: '2px 2px 0 0',
          zIndex: z,
          pointerEvents: 'none',
          opacity: 0.9,
        }}
      />

      {/* Chair seat box */}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: SEAT_W,
          height: cH,
          zIndex: z,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, clipPath: rightClip, background: rgba(color.startsWith('#') ? color : '#888888', 0.7) }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: leftClip,  background: rgba(color.startsWith('#') ? color : '#888888', 0.85) }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: topClip,   background: color, opacity: 0.95 }} />
      </div>
    </>
  );
}

// ── Main Workstation component ────────────────────────────────────────────────

export function Workstation({
  label,
  col,
  row,
  originX,
  originY,
  state,
  color,
  chairColor,
  deskItem,
  isActiveStation = false,
}: WorkstationProps) {
  const [hovered, setHovered] = useState(false);

  const { left: tileLeft, top: tileTop } = tileToScreen(col, row, originX, originY);
  const z = objectZIndex(col, row);

  const isActive = state === 'active';
  const isDone   = state === 'done';
  const isError  = state === 'error';
  const isIdle   = state === 'idle';

  const stateColor = isError ? '#C0604A' : isDone ? '#5BAF8A' : color;
  const dimmed = isIdle && !hovered;

  const containerH = TILE_H + BOX_H; // 52
  const containerLeft = tileLeft;
  const containerTop  = tileTop - BOX_H;
  const liftY = hovered ? -5 : 0;

  const TOP_FACE   = `polygon(${TILE_W / 2}px 0px, ${TILE_W}px ${TILE_H / 2}px, ${TILE_W / 2}px ${TILE_H}px, 0px ${TILE_H / 2}px)`;
  const LEFT_FACE  = `polygon(0px ${TILE_H / 2}px, ${TILE_W / 2}px ${TILE_H}px, ${TILE_W / 2}px ${containerH}px, 0px ${TILE_H / 2 + BOX_H}px)`;
  const RIGHT_FACE = `polygon(${TILE_W / 2}px ${TILE_H}px, ${TILE_W}px ${TILE_H / 2}px, ${TILE_W}px ${TILE_H / 2 + BOX_H}px, ${TILE_W / 2}px ${containerH}px)`;

  // Bright Habbo-style desk surface colors
  const topBg = dimmed
    ? DESK_TOP_IDLE
    : `linear-gradient(135deg, ${rgba(stateColor, 0.22)} 0%, ${rgba(stateColor, 0.06)} 100%)`;

  const leftBg  = dimmed ? DESK_LEFT_IDLE : '#E8E0CC';
  const rightBg = dimmed ? DESK_RIGHT_IDLE : '#D8D0BC';

  // Softer glow — desk glows when active/done
  const glowIntensity = isActive ? 0.7 : isDone ? 0.35 : hovered ? 0.2 : 0;
  const filterGlow =
    glowIntensity > 0
      ? `drop-shadow(0 0 ${6 * glowIntensity}px ${rgba(stateColor, 0.7 * glowIntensity)}) drop-shadow(0 0 ${14 * glowIntensity}px ${rgba(stateColor, 0.25 * glowIntensity)})`
      : 'none';

  return (
    <>
      {/* Chair (rendered first so it's below the desk) */}
      {chairColor && (
        <Chair
          col={col}
          row={row}
          originX={originX}
          originY={originY}
          color={chairColor}
        />
      )}

      {/* Desk box */}
      <div
        style={{
          position: 'absolute',
          left: containerLeft,
          top: containerTop + liftY,
          width: TILE_W,
          height: containerH,
          zIndex: z,
          transition: 'top 0.15s ease-out, filter 0.3s ease',
          filter: filterGlow,
          cursor: 'default',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Active station pulsing ring (WS-01 only) */}
        {isActiveStation && (
          <div
            className="animate-active-ring"
            style={{
              position: 'absolute',
              left: -6,
              top: -6,
              width: TILE_W + 12,
              height: containerH + 12,
              borderRadius: 6,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
        )}

        {/* RIGHT front face */}
        <div style={{ position: 'absolute', inset: 0, clipPath: RIGHT_FACE, background: rightBg }} />

        {/* LEFT front face */}
        <div style={{ position: 'absolute', inset: 0, clipPath: LEFT_FACE, background: leftBg }} />

        {/* TOP face (desk surface) */}
        <div style={{ position: 'absolute', inset: 0, clipPath: TOP_FACE, background: topBg }}>
          {(isActive || hovered) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 35% 40%, ${rgba(stateColor, 0.20)} 0%, transparent 65%)`,
            }} />
          )}

          {/* Personal desk item */}
          {deskItem && <DeskItemDecoration item={deskItem} />}
        </div>

        {/* Monitor screen (sits on top face) */}
        <div
          style={{
            position: 'absolute',
            left: TILE_W / 2 - 13,
            top: 3,
            width: 26,
            height: 18,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: isActive
                ? `linear-gradient(135deg, ${rgba(stateColor, 0.28)}, ${rgba(stateColor, 0.06)})`
                : isDone
                ? 'linear-gradient(135deg, rgba(91,175,138,0.10), rgba(91,175,138,0.02))'
                : MONITOR_IDLE_BG,
              border: `1px solid ${isActive || hovered ? rgba(stateColor, 0.45) : MONITOR_IDLE_BORDER}`,
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Scanlines */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
              opacity: 0.7,
            }} />

            {isActive && (
              <>
                {/* Matrix rain columns — 4 scrolling green strips */}
                {[0, 1, 2, 3].map(c => (
                  <div
                    key={c}
                    className="animate-matrix-fall"
                    style={{
                      position: 'absolute',
                      left: 1 + c * 6,
                      top: 0,
                      width: 4,
                      bottom: 0,
                      background: 'repeating-linear-gradient(to bottom, #00FF41 0px, #00FF41 1px, transparent 1px, transparent 3px)',
                      animationDelay: `${c * 0.28}s`,
                      opacity: 0.9,
                    }}
                  />
                ))}
                {/* Subtle green glow overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,255,65,0.06)' }} />
              </>
            )}

            {isDone && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#5BAF8A',
                fontFamily: 'JetBrains Mono, monospace',
              }}>✓</div>
            )}

            {isError && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#C0604A',
                fontFamily: 'JetBrains Mono, monospace',
              }}>✕</div>
            )}
          </div>
        </div>

        {/* Station label */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: containerH + 5,
          transform: 'translateX(-50%)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color: isActive ? stateColor : isDone ? rgba('#5BAF8A', 0.7) : DESK_LABEL_IDLE,
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
          textShadow: isActive ? `0 0 8px ${stateColor}` : 'none',
          transition: 'color 0.3s ease',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          {label}
          {isActiveStation && !isActive && (
            <span style={{ marginLeft: 3, color: '#DDCC44', opacity: 0.8 }}>★</span>
          )}
        </div>

        {/* Hover tooltip */}
        {hovered && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: -26,
            transform: 'translateX(-50%)',
            background: TOOLTIP_BG,
            border: `1px solid ${tooltipBorder(stateColor)}`,
            borderRadius: 4,
            padding: '3px 10px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: DESK_LABEL_ACTIVE,
            whiteSpace: 'nowrap' as const,
            zIndex: 1000,
            boxShadow: `0 2px 8px rgba(0,0,0,0.12)`,
            pointerEvents: 'none',
          }}>
            {label} — {state.toUpperCase()}
            {isActiveStation && ' ★ ACTIVE'}
          </div>
        )}
      </div>
    </>
  );
}
