// src/components/office/OfficeFloor.tsx
// Renders the isometric floor tile grid with Habbo Hotel-style bright coloring.
// Zone: 'breakroom' (carpet, bottom-left), 'office' (light tiles), 'corridor' (transition).

import {
  TILE_W,
  TILE_H,
  GRID_COLS,
  GRID_ROWS,
  NATURAL_ORIGIN_X,
  NATURAL_ORIGIN_Y,
  tileToScreen,
  tileZIndex,
} from '../../utils/isometric';
import {
  TILE_OFFICE_A, TILE_OFFICE_B,
  TILE_CARPET_A, TILE_CARPET_B,
  TILE_CORRIDOR_A, TILE_CORRIDOR_B,
  TINT_OFFICE, TINT_CARPET, TINT_CORRIDOR,
} from '../../utils/habboColors';

type Zone = 'breakroom' | 'office' | 'corridor';

function getZone(col: number, row: number): Zone {
  // Break room: bottom-left quadrant (warm carpet)
  if (col <= 7 && row >= 8) return 'breakroom';
  // Office: upper-right portion (light tile floor)
  if (col >= 8) return 'office';
  // Corridor / transition zone
  return 'corridor';
}

function isCorridorStrip(col: number, row: number): boolean {
  const colN = col / (GRID_COLS - 1);
  const rowN = (GRID_ROWS - 1 - row) / (GRID_ROWS - 1);
  return Math.abs(colN - rowN) < 0.12;
}

function tileBg(col: number, row: number): string {
  const even = (col + row) % 2 === 0;
  const zone = getZone(col, row);
  switch (zone) {
    case 'breakroom':
      return even ? TILE_CARPET_A : TILE_CARPET_B;
    case 'office':
      return even ? TILE_OFFICE_A : TILE_OFFICE_B;
    default: // corridor
      if (isCorridorStrip(col, row)) return even ? TILE_CORRIDOR_A : TILE_CORRIDOR_B;
      // Remaining corridor tiles lean towards office tone
      return even ? TILE_OFFICE_A : TILE_OFFICE_B;
  }
}

function tileEdgeTint(col: number, row: number): string {
  switch (getZone(col, row)) {
    case 'breakroom': return TINT_CARPET;
    case 'office':    return TINT_OFFICE;
    default:          return TINT_CORRIDOR;
  }
}

// Export for external use (e.g. furniture placement checks)
export { getZone };

interface OfficeFloorProps {
  originX?: number;
  originY?: number;
}

export function OfficeFloor({
  originX = NATURAL_ORIGIN_X,
  originY = NATURAL_ORIGIN_Y,
}: OfficeFloorProps) {
  return (
    <>
      {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, idx) => {
        const col = idx % GRID_COLS;
        const row = Math.floor(idx / GRID_COLS);
        const { left, top } = tileToScreen(col, row, originX, originY);
        return (
          <div
            key={`t-${col}-${row}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: TILE_W,
              height: TILE_H,
              zIndex: tileZIndex(col, row),
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: tileBg(col, row),
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(to bottom, ${tileEdgeTint(col, row)} 0%, transparent 40%)`,
              }}
            />
          </div>
        );
      })}
    </>
  );
}
