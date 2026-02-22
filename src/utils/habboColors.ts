// src/utils/habboColors.ts
// Single source of truth for the bright Habbo Hotel-style color palette.
// All isometric room components import colors from here.

// ── Background / environment ──────────────────────────────────────────────────
export const BG_SKY        = '#A8D4F0';   // outer container sky-blue background
export const GLOW_WARM     = 'rgba(255, 200, 100, 0.12)';  // break room ambient warmth
export const GLOW_COOL     = 'rgba(120, 200, 255, 0.10)';  // office ambient cool light

// ── Floor tiles ───────────────────────────────────────────────────────────────
export const TILE_OFFICE_A    = '#EDE8DC';   // office beige light
export const TILE_OFFICE_B    = '#E2DDD0';   // office beige shadow
export const TILE_CARPET_A    = '#D4A574';   // break room carpet warm
export const TILE_CARPET_B    = '#C49060';   // break room carpet shadow
export const TILE_CORRIDOR_A  = '#DCCFBE';   // transition strip light
export const TILE_CORRIDOR_B  = '#CFC0AC';   // transition strip shadow

// ── Tile top-edge tint (gradient overlay per zone) ────────────────────────────
export const TINT_OFFICE   = 'rgba(180, 180, 200, 0.08)';
export const TINT_CARPET   = 'rgba(160, 100, 40, 0.10)';
export const TINT_CORRIDOR = 'rgba(150, 130, 100, 0.07)';

// ── Walls ─────────────────────────────────────────────────────────────────────
export const WALL_BACK_GRAD = 'linear-gradient(160deg, #F5F0E0 0%, #EDE6D0 55%, #E4DCC8 100%)';
export const WALL_LEFT_GRAD = 'linear-gradient(200deg, #EDE6D4 0%, #E0D8C4 55%, #D8D0BC 100%)';
export const WALL_BASEBOARD = 'rgba(180, 160, 120, 0.25)';
export const WALL_WINDOW_PANE = 'rgba(180, 220, 255, 0.25)'; // window tint on back wall

// ── Workstation desk faces (bright Habbo wood/light aesthetic) ────────────────
export const DESK_TOP_IDLE    = 'linear-gradient(135deg, #F2EDE0 0%, #E8E2D4 100%)';
export const DESK_LEFT_IDLE   = '#DDD8C8';
export const DESK_RIGHT_IDLE  = '#CCC8B8';
export const DESK_LABEL_IDLE  = '#999980';
export const DESK_LABEL_ACTIVE = '#333320';

// ── Monitor ───────────────────────────────────────────────────────────────────
export const MONITOR_IDLE_BG      = '#2A2A44';  // kept dark for contrast / legibility
export const MONITOR_IDLE_BORDER  = '#4A4A6A';

// ── Tooltip ───────────────────────────────────────────────────────────────────
export const TOOLTIP_BG = '#FFFDF5';
export function tooltipBorder(color: string) { return color + '66'; }

// ── Chair colors (one per workstation) ───────────────────────────────────────
export const CHAIR_WS01 = '#E84040';  // red   — WS-01 (active station)
export const CHAIR_WS02 = '#4488DD';  // blue
export const CHAIR_WS03 = '#44BB44';  // green
export const CHAIR_WS04 = '#DDCC44';  // yellow
export const CHAIR_WS05 = '#8844CC';  // purple
export const CHAIR_WS06 = '#EE8833';  // orange

// ── Generic IsoBox / furniture ────────────────────────────────────────────────
export const BOX_SOFA_CUSHION    = '#6888DD';
export const BOX_SOFA_FRAME      = '#5566AA';
export const BOX_POOL_FELT       = '#2E8B4A';
export const BOX_POOL_RAIL       = '#8B5E2E';
export const BOX_FRIDGE_BODY     = '#F0F4F8';
export const BOX_FRIDGE_TRIM     = '#AABBC8';
export const BOX_FRIDGE_SIDE     = '#D8E4EC';
export const BOX_COFFEE_BODY     = '#5C3D2E';
export const BOX_COFFEE_TOP      = '#C0945A';
export const BOX_COFFEE_SIDE     = '#4A2E1E';
export const BOX_VENDING_BODY    = '#CC3344';
export const BOX_VENDING_SIDE    = '#AA2233';
export const BOX_VENDING_STRIPE  = '#FFEE44';
export const BOX_TV_BODY         = '#222244';
export const BOX_TV_SCREEN       = '#1A3A6A';
export const BOX_TV_SIDE         = '#1A1A33';
export const BOX_BEANBAG_RED     = '#E84040';
export const BOX_BEANBAG_YELLOW  = '#DDCC44';

// ── Plants ────────────────────────────────────────────────────────────────────
export const PLANT_POT        = '#C46E4E';   // terracotta pot
export const PLANT_POT_SHADOW = '#A0583C';
export const PLANT_LEAF_DARK  = '#2A7A3A';
export const PLANT_LEAF_MID   = '#3A9A4A';
export const PLANT_LEAF_LIGHT = '#4ABB5A';

// ── Water cooler ──────────────────────────────────────────────────────────────
export const COOLER_BODY  = '#E8F0F8';
export const COOLER_TRIM  = '#8AAABB';
export const COOLER_JUG   = 'rgba(100, 180, 220, 0.70)';

// ── Fish tank ─────────────────────────────────────────────────────────────────
export const TANK_FRAME   = '#448888';
export const TANK_FRAME_S = '#336666';
export const TANK_WATER_A = 'rgba(60, 140, 220, 0.55)';
export const TANK_WATER_B = 'rgba(40, 100, 180, 0.40)';
export const TANK_FISH_1  = '#FF8844';  // orange fish
export const TANK_FISH_2  = '#FFEE22';  // yellow fish
export const TANK_FISH_3  = '#FF4488';  // pink fish

// ── Agent sprite ──────────────────────────────────────────────────────────────
export const AGENT_SKIN = '#C9956A';  // skin tone (unchanged)
export const AGENT_BODY = '#D4956A';  // default body color (unchanged)

// ── Agent taskbar (kept dark for legibility on bright background) ─────────────
export const TASKBAR_BG   = '#18182A';
export const TASKBAR_TEXT = '#E8E8F0';

// ── UI chrome ─────────────────────────────────────────────────────────────────
export const BTN_IDLE_BG   = '#F5A623';
export const BTN_IDLE_TEXT = '#0A0A0F';
export const BTN_DONE_BG   = '#34D399';
export const BTN_BUSY_BG   = '#E8E0D0';
export const BTN_BUSY_TEXT = '#88806A';
export const GRID_LABEL    = '#8899AA';

// ── Shag rug (break room center) ──────────────────────────────────────────────
export const RUG_TOP   = '#C8705A';   // burnt orange-red
export const RUG_LEFT  = '#A85A48';
export const RUG_RIGHT = '#8E4A3A';

// ── Wall decorations ──────────────────────────────────────────────────────────
export const WALL_POSTER_FRAME  = '#4A3A2A';
export const WALL_WHITEBOARD    = '#F8F8F0';
export const WALL_NOTICEBOARD   = '#C8A460';
export const WALL_CLOCK_BG      = '#0A0A14';

// ── Coffee steam ──────────────────────────────────────────────────────────────
export const STEAM_COLOR = 'rgba(255,255,255,0.55)';

// ── Neon vending machines ─────────────────────────────────────────────────────
export const VEND_SNACK_BODY  = '#CC2266';   // hot pink snack machine
export const VEND_SNACK_SIDE  = '#AA1155';
export const VEND_DRINKS_BODY = '#2244CC';   // electric blue drinks machine
export const VEND_DRINKS_SIDE = '#1133AA';
export const VEND_NEON_PINK   = '#FF44CC';
export const VEND_NEON_BLUE   = '#44AAFF';
