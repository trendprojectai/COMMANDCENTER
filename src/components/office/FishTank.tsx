// src/components/office/FishTank.tsx
// Large animated isometric fish tank — 3 fish, rising bubbles, subtle water glow.
// Wider than a single tile to look more impressive (spans ~1.5 tiles in screen space).

import {
  TILE_W,
  TILE_H,
  NATURAL_ORIGIN_X,
  NATURAL_ORIGIN_Y,
  tileToScreen,
  objectZIndex,
} from '../../utils/isometric';
import {
  TANK_FRAME,
  TANK_FRAME_S,
  TANK_WATER_A,
  TANK_WATER_B,
  TANK_FISH_1,
  TANK_FISH_2,
  TANK_FISH_3,
} from '../../utils/habboColors';

// Tank is much taller and ~1.5 tiles wide for a large floor-standing look
const BOX_H      = 52;
const TANK_W     = Math.round(TILE_W * 1.5);  // 96px
const TANK_TILE_H = TILE_H;                   // top face height

// Clip paths for a 1.5-tile-wide isometric box
const HALF_W  = TANK_W / 2;                   // 48
const TOTAL_H = TANK_TILE_H + BOX_H;

const TOP_FACE   = `polygon(${HALF_W}px 0px, ${TANK_W}px ${TANK_TILE_H / 2}px, ${HALF_W}px ${TANK_TILE_H}px, 0px ${TANK_TILE_H / 2}px)`;
const LEFT_FACE  = `polygon(0px ${TANK_TILE_H / 2}px, ${HALF_W}px ${TANK_TILE_H}px, ${HALF_W}px ${TOTAL_H}px, 0px ${TANK_TILE_H / 2 + BOX_H}px)`;
const RIGHT_FACE = `polygon(${HALF_W}px ${TANK_TILE_H}px, ${TANK_W}px ${TANK_TILE_H / 2}px, ${TANK_W}px ${TANK_TILE_H / 2 + BOX_H}px, ${HALF_W}px ${TOTAL_H}px)`;

interface FishTankProps {
  col: number;
  row: number;
  originX?: number;
  originY?: number;
}

export function FishTank({
  col,
  row,
  originX = NATURAL_ORIGIN_X,
  originY = NATURAL_ORIGIN_Y,
}: FishTankProps) {
  const { left: tileLeft, top: tileTop } = tileToScreen(col, row, originX, originY);
  const z = objectZIndex(col, row);

  // Shift left by TILE_W/2 so the 1.5-wide tank centers on the tile
  const containerLeft = tileLeft - Math.round(TILE_W * 0.25);
  const containerTop  = tileTop - BOX_H;

  return (
    <div
      style={{
        position: 'absolute',
        left: containerLeft,
        top: containerTop,
        width: TANK_W,
        height: TOTAL_H,
        zIndex: z,
        pointerEvents: 'none',
        // Subtle aqua glow around the whole tank
        filter: 'drop-shadow(0 0 8px rgba(60,140,220,0.35))',
      }}
    >
      {/* RIGHT face — main glass viewing panel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: RIGHT_FACE,
          background: TANK_FRAME,
        }}
      >
        {/* Water fill — occupies the lower portion of the right face */}
        <div
          className="animate-pulse-glow"
          style={{
            position: 'absolute',
            left: HALF_W + 2,
            top: TANK_TILE_H / 2 + 2,
            right: 2,
            bottom: 3,
            background: `linear-gradient(180deg, ${TANK_WATER_A} 0%, ${TANK_WATER_B} 100%)`,
            borderRadius: 2,
          }}
        >
          {/* Glass specular reflection */}
          <div style={{
            position: 'absolute',
            left: 1, top: 1, width: 2, height: '70%',
            background: 'rgba(255,255,255,0.35)',
            borderRadius: 1,
          }} />

          {/* Fish 1 — orange, swims back and forth */}
          <div
            className="animate-fish-swim"
            style={{
              position: 'absolute',
              bottom: 10, left: 2,
              width: 10, height: 6,
              background: TANK_FISH_1,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            }}
          >
            <div style={{ position: 'absolute', right: -3, top: 1, width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${TANK_FISH_1}` }} />
          </div>

          {/* Fish 2 — yellow, opposite phase */}
          <div
            className="animate-fish-swim-b"
            style={{
              position: 'absolute',
              top: 6, left: 3,
              width: 8, height: 5,
              background: TANK_FISH_2,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            }}
          >
            <div style={{ position: 'absolute', right: -2, top: 0, width: 0, height: 0, borderTop: '2px solid transparent', borderBottom: '3px solid transparent', borderLeft: `3px solid ${TANK_FISH_2}` }} />
          </div>

          {/* Fish 3 — pink, mid level */}
          <div
            className="animate-fish-swim-c"
            style={{
              position: 'absolute',
              bottom: 22, left: 4,
              width: 7, height: 4,
              background: TANK_FISH_3,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            }}
          >
            <div style={{ position: 'absolute', right: -2, top: 0, width: 0, height: 0, borderTop: '2px solid transparent', borderBottom: '2px solid transparent', borderLeft: `3px solid ${TANK_FISH_3}` }} />
          </div>

          {/* Rising bubbles — 4 with staggered delays */}
          {[
            { left: 6,  bottom: 3,  w: 3, delay: '0s'     },
            { left: 12, bottom: 6,  w: 2, delay: '-0.6s'  },
            { left: 18, bottom: 2,  w: 3, delay: '-1.2s'  },
            { left: 22, bottom: 8,  w: 2, delay: '-1.8s'  },
          ].map((b, i) => (
            <div
              key={i}
              className="animate-tank-bubble"
              style={{
                position: 'absolute',
                left: b.left, bottom: b.bottom,
                width: b.w, height: b.w,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.40)',
                animationDelay: b.delay,
              }}
            />
          ))}

          {/* Aquatic plant/seaweed at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 3, width: 2, height: 10, background: '#2A8A4A', borderRadius: '1px 1px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 20, width: 2, height: 7,  background: '#3A9A5A', borderRadius: '1px 1px 0 0' }} />
        </div>
      </div>

      {/* LEFT face — dark glass side panel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: LEFT_FACE,
          background: TANK_FRAME_S,
        }}
      >
        {/* Side water tint */}
        <div style={{
          position: 'absolute',
          left: 2, top: TANK_TILE_H / 2 + 2,
          width: HALF_W - 4, bottom: 3,
          background: 'rgba(40,100,180,0.30)',
          borderRadius: 1,
        }} />
      </div>

      {/* TOP face — water surface */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: TOP_FACE,
          background: 'linear-gradient(135deg, rgba(80,160,240,0.75) 0%, rgba(40,120,200,0.60) 100%)',
        }}
      >
        {/* Surface sparkle */}
        <div style={{
          position: 'absolute',
          left: HALF_W - 10, top: TANK_TILE_H / 4 - 2,
          width: 8, height: 2,
          background: 'rgba(255,255,255,0.55)',
          borderRadius: 1,
        }} />
        <div style={{
          position: 'absolute',
          left: HALF_W + 4, top: TANK_TILE_H / 4,
          width: 4, height: 1,
          background: 'rgba(255,255,255,0.40)',
          borderRadius: 1,
        }} />
      </div>
    </div>
  );
}
