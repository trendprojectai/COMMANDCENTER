// src/components/office/PlantSprite.tsx
// Proper isometric plant sprites — terracotta pot with leafy foliage blobs above.
// Replaces the solid-green IsoBox plant variant.

import {
  TILE_W,
  TILE_H,
  tileToScreen,
  objectZIndex,
  NATURAL_ORIGIN_X,
  NATURAL_ORIGIN_Y,
} from '../../utils/isometric';

interface PlantSpriteProps {
  col: number;
  row: number;
  originX?: number;
  originY?: number;
  size: 'tall' | 'medium' | 'small';
}

// Pot colors (terracotta)
const POT_BODY   = '#C46E4E';
const POT_SIDE   = '#A0583C';
const POT_SHADOW = '#8A4430';

// Leaf colors (3 shades of green for depth)
const LEAF_DARK  = '#2A7A3A';
const LEAF_MID   = '#3A9A4A';
const LEAF_LIGHT = '#4ABB5A';

interface PotProps {
  left: number;
  top: number;
  potH: number;
}

function Pot({ left, top, potH }: PotProps) {
  const POT_W = Math.round(TILE_W * 0.35);  // ~22px
  const POT_H_TOTAL = Math.round(TILE_H * 0.35) + potH;
  const POT_TILE_H  = Math.round(TILE_H * 0.35); // top diamond height

  const halfW = POT_W / 2;

  // Isometric pot — small 3-face box
  const topClip   = `polygon(${halfW}px 0px, ${POT_W}px ${POT_TILE_H / 2}px, ${halfW}px ${POT_TILE_H}px, 0px ${POT_TILE_H / 2}px)`;
  const leftClip  = `polygon(0px ${POT_TILE_H / 2}px, ${halfW}px ${POT_TILE_H}px, ${halfW}px ${POT_H_TOTAL}px, 0px ${POT_TILE_H / 2 + potH}px)`;
  const rightClip = `polygon(${halfW}px ${POT_TILE_H}px, ${POT_W}px ${POT_TILE_H / 2}px, ${POT_W}px ${POT_TILE_H / 2 + potH}px, ${halfW}px ${POT_H_TOTAL}px)`;

  return (
    <div style={{ position: 'absolute', left: left - halfW, top: top - potH, width: POT_W, height: POT_H_TOTAL, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: rightClip, background: POT_SIDE }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: leftClip,  background: POT_SHADOW }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: topClip,   background: POT_BODY }} />
    </div>
  );
}

export function PlantSprite({
  col,
  row,
  originX = NATURAL_ORIGIN_X,
  originY = NATURAL_ORIGIN_Y,
  size,
}: PlantSpriteProps) {
  const { left: tileLeft, top: tileTop } = tileToScreen(col, row, originX, originY);
  const z = objectZIndex(col, row);

  // Anchor: center of tile top face
  const cx = tileLeft + TILE_W / 2;
  const cy = tileTop  + TILE_H / 2;

  const configs = {
    tall: {
      potH: 8,
      potOffsetY: 0,
      blobs: [
        { dx: 0,  dy: -8,  r: 13, color: LEAF_DARK  },
        { dx: -5, dy: -18, r: 11, color: LEAF_MID   },
        { dx: 4,  dy: -22, r: 10, color: LEAF_MID   },
        { dx: 0,  dy: -30, r: 8,  color: LEAF_LIGHT },
        { dx: -3, dy: -26, r: 9,  color: LEAF_DARK  },
      ],
    },
    medium: {
      potH: 7,
      potOffsetY: 0,
      blobs: [
        { dx: 0,  dy: -7,  r: 11, color: LEAF_DARK  },
        { dx: -4, dy: -16, r: 10, color: LEAF_MID   },
        { dx: 4,  dy: -16, r: 9,  color: LEAF_MID   },
        { dx: 0,  dy: -22, r: 7,  color: LEAF_LIGHT },
      ],
    },
    small: {
      potH: 5,
      potOffsetY: 0,
      blobs: [
        { dx: 0,  dy: -5,  r: 8,  color: LEAF_DARK  },
        { dx: -2, dy: -10, r: 7,  color: LEAF_MID   },
        { dx: 2,  dy: -10, r: 6,  color: LEAF_LIGHT },
      ],
    },
  };

  const cfg = configs[size];

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      {/* Pot */}
      <Pot left={cx} top={cy} potH={cfg.potH} />

      {/* Leaf blobs — rendered bottom-to-top for correct overlap */}
      {cfg.blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + b.dx - b.r,
            top: cy + b.dy - b.r,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 35%, ${b.color}EE, ${b.color}AA)`,
            border: `1px solid ${LEAF_DARK}66`,
          }}
        />
      ))}
    </div>
  );
}
