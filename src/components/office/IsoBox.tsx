// src/components/office/IsoBox.tsx
// Generic isometric 3-face box used for all static furniture items.
// Supports 1×1 and 2×1 tile footprints (colSpan=1|2, rowSpan=1).

import {
  TILE_W,
  TILE_H,
  NATURAL_ORIGIN_X,
  NATURAL_ORIGIN_Y,
  tileToScreen,
  objectZIndex,
} from '../../utils/isometric';
import { VEND_NEON_PINK, VEND_NEON_BLUE, STEAM_COLOR } from '../../utils/habboColors';

export type FurnitureVariant =
  | 'sofa'
  | 'pool-table'
  | 'fridge'
  | 'coffee-machine'
  | 'vending-machine'
  | 'vending-snack'
  | 'vending-drinks'
  | 'tv-stand'
  | 'beanbag'
  | 'plant-large'
  | 'plant-medium'
  | 'plant-small'
  | 'water-cooler'
  | 'shag-rug';

export interface IsoBoxProps {
  col: number;
  row: number;
  originX?: number;
  originY?: number;
  colSpan?: number;   // 1 or 2 (horizontal tile span)
  rowSpan?: number;   // always 1 for now
  boxHeight: number;  // visual z-height in px
  topColor: string;
  leftColor: string;
  rightColor: string;
  variant?: FurnitureVariant;
  label?: string;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface BoxGeometry {
  containerW: number;
  containerH: number;
  topClip: string;
  leftClip: string;
  rightClip: string;
  // Position offset so anchor = leftmost/backmost tile
  offsetX: number;
}

function computeGeometry(colSpan: number, boxH: number): BoxGeometry {
  if (colSpan === 1) {
    const cH = TILE_H + boxH;
    return {
      containerW: TILE_W,
      containerH: cH,
      topClip:   `polygon(${TILE_W / 2}px 0px, ${TILE_W}px ${TILE_H / 2}px, ${TILE_W / 2}px ${TILE_H}px, 0px ${TILE_H / 2}px)`,
      leftClip:  `polygon(0px ${TILE_H / 2}px, ${TILE_W / 2}px ${TILE_H}px, ${TILE_W / 2}px ${cH}px, 0px ${TILE_H / 2 + boxH}px)`,
      rightClip: `polygon(${TILE_W / 2}px ${TILE_H}px, ${TILE_W}px ${TILE_H / 2}px, ${TILE_W}px ${TILE_H / 2 + boxH}px, ${TILE_W / 2}px ${cH}px)`,
      offsetX: 0,
    };
  }
  // colSpan === 2: top face is a wide diamond spanning 2 tiles in iso space
  // In screen space: width = TILE_W * 1.5, height = TILE_H * 1 (same as 1 row depth)
  // Top face corners (in a TILE_W*1.5 wide container):
  //   left  = (0, TILE_H/2)
  //   back  = (TILE_W*3/4, 0)
  //   right = (TILE_W*1.5, TILE_H/2)
  //   front = (TILE_W*3/4, TILE_H)
  const W2 = Math.round(TILE_W * 1.5); // 96
  const cH = TILE_H + boxH;
  const midX = Math.round(W2 / 2);     // 48
  return {
    containerW: W2,
    containerH: cH,
    topClip:   `polygon(0px ${TILE_H / 2}px, ${midX}px 0px, ${W2}px ${TILE_H / 2}px, ${midX}px ${TILE_H}px)`,
    leftClip:  `polygon(0px ${TILE_H / 2}px, ${midX}px ${TILE_H}px, ${midX}px ${cH}px, 0px ${TILE_H / 2 + boxH}px)`,
    rightClip: `polygon(${midX}px ${TILE_H}px, ${W2}px ${TILE_H / 2}px, ${W2}px ${TILE_H / 2 + boxH}px, ${midX}px ${cH}px)`,
    // Shift left so the front-left corner aligns with the anchor tile's left edge
    offsetX: -(TILE_W / 2),
  };
}

// ── Variant decoration layers ─────────────────────────────────────────────────

function TopDecoration({ variant, containerW }: { variant: FurnitureVariant; containerW: number }) {
  const cx = containerW / 2;
  switch (variant) {
    case 'sofa':
      // Cushion strip across the upper portion of the top face
      return (
        <div style={{
          position: 'absolute',
          left: cx - 18,
          top: 4,
          width: 36,
          height: 10,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: 3,
        }} />
      );
    case 'pool-table':
      // Two white billiard balls on the felt
      return (
        <>
          <div style={{ position: 'absolute', left: cx - 10, top: 8, width: 5, height: 5, borderRadius: '50%', background: '#FFFDE8' }} />
          <div style={{ position: 'absolute', left: cx + 4,  top: 6, width: 4, height: 4, borderRadius: '50%', background: '#FFFDE8' }} />
        </>
      );
    case 'fridge':
      // Small magnets on top face (they'd normally be on the door/side)
      return (
        <>
          <div style={{ position: 'absolute', left: cx - 4, top: 6, width: 4, height: 3, background: '#FF8844', borderRadius: 1 }} />
          <div style={{ position: 'absolute', left: cx + 1,  top: 6, width: 3, height: 3, background: '#44AAEE', borderRadius: 1 }} />
        </>
      );
    case 'coffee-machine':
      // Cup silhouette + rising steam wisps
      return (
        <>
          <div style={{
            position: 'absolute',
            left: cx - 3, top: 5,
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#E8DCD0',
            border: '1px solid rgba(0,0,0,0.15)',
          }} />
          {/* Steam wisps — these extend above the top face (overflow:visible on container) */}
          <div className="animate-coffee-steam" style={{
            position: 'absolute',
            left: cx - 1, top: -6,
            width: 3, height: 6,
            background: STEAM_COLOR,
            borderRadius: 2,
          }} />
          <div className="animate-coffee-steam" style={{
            position: 'absolute',
            left: cx + 3, top: -4,
            width: 2, height: 5,
            background: STEAM_COLOR,
            borderRadius: 2,
            animationDelay: '-1.1s',
          }} />
        </>
      );
    case 'tv-stand':
      // Dark screen rectangle on top
      return (
        <div style={{
          position: 'absolute',
          left: cx - 10,
          top: 3,
          width: 20,
          height: 12,
          background: '#1A3A6A',
          borderRadius: 1,
          border: '1px solid rgba(100,150,220,0.4)',
        }} />
      );
    case 'water-cooler':
      // Blue jug circle
      return (
        <div style={{
          position: 'absolute',
          left: cx - 5,
          top: 3,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(100, 180, 220, 0.70)',
          border: '1px solid rgba(100,180,220,0.5)',
        }} />
      );
    case 'plant-large':
    case 'plant-medium':
    case 'plant-small': {
      const size = variant === 'plant-large' ? 18 : variant === 'plant-medium' ? 14 : 10;
      return (
        <div style={{
          position: 'absolute',
          left: cx - size / 2,
          top: 2 - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #4ABB5A, #2A7A3A)',
          border: '1px solid #1A5A2A',
        }} />
      );
    }
    case 'shag-rug': {
      // Textured dot pattern suggesting shaggy fabric
      const dots = [
        { x: cx - 14, y: 5 }, { x: cx - 8, y: 3 }, { x: cx - 2, y: 5 }, { x: cx + 4, y: 3 },
        { x: cx + 10, y: 5 }, { x: cx - 12, y: 10 }, { x: cx - 6, y: 8 }, { x: cx, y: 10 },
        { x: cx + 6, y: 8 }, { x: cx + 12, y: 10 },
      ];
      return (
        <>
          {dots.map((d, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: d.x - 1, top: d.y - 1,
              width: 3, height: 3, borderRadius: '50%',
              background: 'rgba(255,255,255,0.28)',
            }} />
          ))}
        </>
      );
    }
    case 'vending-snack':
    case 'vending-drinks': {
      // Product silhouettes on top
      const color = variant === 'vending-snack' ? VEND_NEON_PINK : VEND_NEON_BLUE;
      return (
        <>
          <div style={{ position: 'absolute', left: cx - 5, top: 4, width: 4, height: 6, background: color, borderRadius: 1, opacity: 0.7 }} />
          <div style={{ position: 'absolute', left: cx + 1, top: 4, width: 4, height: 6, background: color, borderRadius: 1, opacity: 0.5 }} />
        </>
      );
    }
    case 'vending-machine':
    case 'beanbag':
    default:
      return null;
  }
}

function RightFaceDecoration({ variant, boxHeight }: {
  variant: FurnitureVariant;
  boxHeight: number;
}) {
  // The right face occupies roughly the right half of the container
  // Items placed here appear on the "front-right" visible face
  const faceTop = TILE_H / 2;
  const faceH = boxHeight;

  switch (variant) {
    case 'vending-machine':
      // Colorful vertical stripes / display panel
      return (
        <>
          {/* Yellow stripe */}
          <div style={{
            position: 'absolute',
            right: 2,
            top: faceTop + Math.round(faceH * 0.15),
            width: 4,
            height: Math.round(faceH * 0.7),
            background: '#FFEE44',
            borderRadius: 1,
          }} />
          {/* Selection buttons row */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              right: 8,
              top: faceTop + Math.round(faceH * 0.25) + i * 8,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: i === 0 ? '#FF4444' : i === 1 ? '#44BB44' : '#4488DD',
            }} />
          ))}
        </>
      );
    case 'fridge':
      // Door handle
      return (
        <div style={{
          position: 'absolute',
          right: 4,
          top: faceTop + Math.round(faceH * 0.3),
          width: 2,
          height: Math.round(faceH * 0.4),
          background: '#AABBC8',
          borderRadius: 1,
        }} />
      );
    case 'water-cooler':
      // Dispenser tap
      return (
        <div style={{
          position: 'absolute',
          right: 6,
          top: faceTop + Math.round(faceH * 0.5),
          width: 4,
          height: 3,
          background: '#4488CC',
          borderRadius: 1,
        }} />
      );
    case 'tv-stand':
      // TV screen area on right face
      return (
        <div style={{
          position: 'absolute',
          right: 2,
          top: faceTop + 2,
          width: 18,
          height: Math.round(faceH * 0.6),
          background: '#1A3A6A',
          borderRadius: 2,
          border: '1px solid rgba(100,150,220,0.5)',
        }} />
      );
    case 'vending-snack': {
      // Neon pink display + buttons
      const neonColor = VEND_NEON_PINK;
      return (
        <>
          {/* Display panel */}
          <div style={{ position: 'absolute', right: 2, top: faceTop + 2, width: 14, height: Math.round(faceH * 0.35), background: '#220011', borderRadius: 1, border: `1px solid ${neonColor}55` }}>
            <div style={{ margin: 2, height: '60%', background: `${neonColor}33`, borderRadius: 1 }} />
          </div>
          {/* Selection buttons with neon glow */}
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="animate-vending-glow" style={{
              position: 'absolute',
              right: 4,
              top: faceTop + Math.round(faceH * 0.43) + i * 7,
              width: 6, height: 5,
              borderRadius: 1,
              background: neonColor,
              boxShadow: `0 0 4px ${neonColor}`,
              color: neonColor,
            }} />
          ))}
        </>
      );
    }
    case 'vending-drinks': {
      const neonColor = VEND_NEON_BLUE;
      return (
        <>
          <div style={{ position: 'absolute', right: 2, top: faceTop + 2, width: 14, height: Math.round(faceH * 0.35), background: '#000022', borderRadius: 1, border: `1px solid ${neonColor}55` }}>
            <div style={{ margin: 2, height: '60%', background: `${neonColor}33`, borderRadius: 1 }} />
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="animate-vending-glow" style={{
              position: 'absolute',
              right: 4,
              top: faceTop + Math.round(faceH * 0.43) + i * 7,
              width: 6, height: 5,
              borderRadius: 1,
              background: neonColor,
              boxShadow: `0 0 4px ${neonColor}`,
              color: neonColor,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </>
      );
    }
    default:
      return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function IsoBox({
  col,
  row,
  originX = NATURAL_ORIGIN_X,
  originY = NATURAL_ORIGIN_Y,
  colSpan = 1,
  boxHeight,
  topColor,
  leftColor,
  rightColor,
  variant,
}: IsoBoxProps) {
  const geo = computeGeometry(colSpan, boxHeight);

  const { left: tileLeft, top: tileTop } = tileToScreen(col, row, originX, originY);

  // Z-index based on the center tile of the object's footprint
  const centerCol = col + Math.floor(colSpan / 2);
  const z = objectZIndex(centerCol, row);

  const containerLeft = tileLeft + geo.offsetX;
  const containerTop  = tileTop - boxHeight;

  // Coffee machine needs overflow:visible so steam wisps rise above the box
  const needsOverflow = variant === 'coffee-machine';

  return (
    <div
      style={{
        position: 'absolute',
        left: containerLeft,
        top: containerTop,
        width: geo.containerW,
        height: geo.containerH,
        zIndex: z,
        pointerEvents: 'none',
        overflow: needsOverflow ? 'visible' : undefined,
      }}
    >
      {/* RIGHT front face */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: geo.rightClip,
          background: rightColor,
        }}
      >
        {variant && (
          <RightFaceDecoration
            variant={variant}
            boxHeight={boxHeight}
          />
        )}
      </div>

      {/* LEFT front face */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: geo.leftClip,
          background: leftColor,
        }}
      />

      {/* TOP face */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: geo.topClip,
          background: topColor,
        }}
      >
        {variant && (
          <TopDecoration variant={variant} containerW={geo.containerW} />
        )}
      </div>
    </div>
  );
}
