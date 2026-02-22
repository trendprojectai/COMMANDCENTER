// src/utils/isometric.ts
// Projection: isometric grid coordinate helpers

export const TILE_W = 64;
export const TILE_H = 32;
export const GRID_COLS = 22;
export const GRID_ROWS = 16;
export const BOX_H = 20; // workstation desk height in screen pixels

// Natural (unscaled) origin that aligns the grid so its bounding box starts at (0,0).
// Leftmost tile is col=0, row=GRID_ROWS-1:
//   left = originX + (0 - (GRID_ROWS-1)) * TILE_W/2 - TILE_W/2
// Setting left = 0:  originX = (GRID_ROWS-1)*TILE_W/2 + TILE_W/2
export const NATURAL_ORIGIN_X = (GRID_ROWS - 1) * (TILE_W / 2) + TILE_W / 2; // 512
export const NATURAL_ORIGIN_Y = 0;

// Full pixel dimensions of the unscaled grid bounding box.
// GRID_W: from leftmost tile left-edge (0) to rightmost tile right-edge
//   rightmost = col=GRID_COLS-1, row=0: left = 512 + (21)*32 - 32 = 1152; right = 1152+64 = 1216
export const GRID_W = (GRID_COLS + GRID_ROWS - 2) * (TILE_W / 2) + TILE_W; // 1216
// GRID_H: from top tile top-edge (0) to bottom tile bottom-edge
//   bottom = col=GRID_COLS-1, row=GRID_ROWS-1: top = (21+15)*16 = 576; bottom = 576+32 = 608
export const GRID_H = (GRID_COLS + GRID_ROWS - 2) * (TILE_H / 2) + TILE_H; // 608

export interface TilePos {
  left: number;
  top: number;
}

/**
 * Converts a grid tile (col, row) to absolute CSS position.
 * left = originX + (col - row) * TILE_W/2 - TILE_W/2
 * top  = originY + (col + row) * TILE_H/2
 */
export function tileToScreen(
  col: number,
  row: number,
  originX: number,
  originY: number,
): TilePos {
  return {
    left: originX + (col - row) * (TILE_W / 2) - TILE_W / 2,
    top: originY + (col + row) * (TILE_H / 2),
  };
}

/** Base z-index for floor tiles. */
export function tileZIndex(col: number, row: number): number {
  return col + row;
}

/** Z-index for objects sitting on a tile (desks, furniture). */
export function objectZIndex(col: number, row: number): number {
  return col + row + 100;
}

/** Z-index for the agent sprite (above objects). */
export function spriteZIndex(col: number, row: number): number {
  return col + row + 200;
}
