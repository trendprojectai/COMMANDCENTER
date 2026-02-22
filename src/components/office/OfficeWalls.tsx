// src/components/office/OfficeWalls.tsx
// Renders back wall (row=0) and left wall (col=0) panels with decorations:
// meme posters, whiteboard, notice board, digital clock, sky windows.

import {
  TILE_W,
  TILE_H,
  GRID_COLS,
  NATURAL_ORIGIN_X,
  NATURAL_ORIGIN_Y,
  tileToScreen,
} from '../../utils/isometric';
import {
  WALL_BACK_GRAD,
  WALL_LEFT_GRAD,
  WALL_BASEBOARD,
  WALL_WINDOW_PANE,
} from '../../utils/habboColors';

// Wall geometry
const WALL_H       = 70;
const WALL_PANEL_H = WALL_H + TILE_H / 2;  // 86
const WALL_SLOPE   = ((TILE_H / 2) / WALL_PANEL_H * 100).toFixed(1) + '%';
const WALL_TOP     = (WALL_H / WALL_PANEL_H * 100).toFixed(1) + '%';

const CLIP_RIGHT = `polygon(0% 0%, 100% ${WALL_SLOPE}, 100% 100%, 0% ${WALL_TOP})`;
const CLIP_LEFT  = `polygon(100% 0%, 0% ${WALL_SLOPE}, 0% 100%, 100% ${WALL_TOP})`;

// Decoration column assignments
const WINDOW_COLS     = new Set([11, 12, 13, 14]);
const POSTER_COLS     = new Set([6, 10, 17]);
const NOTICEBOARD_COL = 4;
const CLOCK_COL       = 2;
// Whiteboard spans cols 19–21; we render it once at col 19

// ── Decoration sub-components ─────────────────────────────────────────────────

function MemePosters({ panelH }: { panelH: number }) {
  // A simple "meme-format" rectangle: top image area + bottom caption area
  const midY = panelH * 0.12;
  const frameH = panelH * 0.68;
  return (
    <div style={{ position: 'absolute', left: 3, top: midY, right: 3, height: frameH, background: '#2A2010', borderRadius: 1 }}>
      {/* Image area (top ~60%) */}
      <div style={{ position: 'absolute', left: 2, top: 2, right: 2, height: '55%', background: '#F8F4EC', borderRadius: 1, overflow: 'hidden' }}>
        {/* Face-like oval — top-meme character */}
        <div style={{ position: 'absolute', left: '25%', top: '10%', width: '50%', height: '55%', background: '#FFDCAA', borderRadius: '50%', border: '1px solid #D4A860' }} />
        {/* Eyes */}
        <div style={{ position: 'absolute', left: '33%', top: '28%', width: '12%', height: '12%', borderRadius: '50%', background: '#222' }} />
        <div style={{ position: 'absolute', left: '55%', top: '28%', width: '12%', height: '12%', borderRadius: '50%', background: '#222' }} />
        {/* Mouth / expression */}
        <div style={{ position: 'absolute', left: '38%', top: '50%', width: '24%', height: '10%', borderRadius: '0 0 6px 6px', border: '1px solid #333', borderTop: 'none', background: 'transparent' }} />
      </div>
      {/* Caption area (bottom ~38%) — horizontal rule lines suggesting text */}
      <div style={{ position: 'absolute', left: 2, bottom: 2, right: 2, height: '38%', background: '#F0ECD8', borderRadius: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, padding: '0 3px' }}>
        <div style={{ height: 1, background: '#A09080', borderRadius: 1 }} />
        <div style={{ height: 1, background: '#A09080', width: '75%', borderRadius: 1 }} />
        <div style={{ height: 1, background: '#B0A090', borderRadius: 1 }} />
      </div>
    </div>
  );
}

function NoticeBoard({ panelH }: { panelH: number }) {
  const top = panelH * 0.10;
  const h   = panelH * 0.72;
  // Cork-colored background with pinned papers
  const papers = [
    { l: '8%',  t: '10%', w: '45%', h: '35%', rotate: '3deg',  color: '#FFFEF0' },
    { l: '45%', t: '8%',  w: '40%', h: '40%', rotate: '-4deg', color: '#FFF8E0' },
    { l: '10%', t: '50%', w: '38%', h: '32%', rotate: '-2deg', color: '#F0FFF0' },
    { l: '50%', t: '52%', w: '42%', h: '30%', rotate: '5deg',  color: '#F0F0FF' },
    { l: '20%', t: '28%', w: '20%', h: '25%', rotate: '-6deg', color: '#FFF0F0' },
  ];
  const pins = [
    { l: '28%', t: '23%', c: '#EE4444' },
    { l: '61%', t: '21%', c: '#4444EE' },
    { l: '27%', t: '63%', c: '#44BB44' },
    { l: '68%', t: '65%', c: '#EECC22' },
    { l: '37%', t: '39%', c: '#EE7744' },
  ];
  return (
    <div style={{ position: 'absolute', left: 2, top: top, right: 2, height: h, background: '#C8A460', borderRadius: 2, border: '1px solid #A08040', overflow: 'hidden' }}>
      {papers.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.l, top: p.t, width: p.w, height: p.h,
          background: p.color, borderRadius: 1,
          transform: `rotate(${p.rotate})`,
          boxShadow: '1px 1px 2px rgba(0,0,0,0.2)',
        }}>
          {/* Paper lines */}
          <div style={{ position: 'absolute', left: '10%', top: '30%', right: '10%', height: 1, background: 'rgba(0,0,0,0.12)' }} />
          <div style={{ position: 'absolute', left: '10%', top: '55%', right: '20%', height: 1, background: 'rgba(0,0,0,0.10)' }} />
        </div>
      ))}
      {pins.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.l, top: p.t,
          width: 4, height: 4, borderRadius: '50%',
          background: p.c,
          boxShadow: `0 0 2px ${p.c}`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}
    </div>
  );
}

function DigitalClock({ panelH }: { panelH: number }) {
  const top = panelH * 0.25;
  return (
    <div style={{
      position: 'absolute', left: 3, top: top, right: 3, height: panelH * 0.35,
      background: '#0A0A14', borderRadius: 2, border: '1px solid #1A2A3A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 6px rgba(0,255,65,0.20)',
    }}>
      <span className="animate-led-blink" style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 6,
        fontVariantNumeric: 'tabular-nums',
        color: '#00FF41',
        textShadow: '0 0 4px #00FF41',
        letterSpacing: '0.08em',
      }}>
        09:41
      </span>
    </div>
  );
}

function WindowPane({ panelH }: { panelH: number }) {
  const top = panelH * 0.08;
  const h   = panelH * 0.60;
  return (
    <div style={{ position: 'absolute', left: 3, top, right: 3, height: h, overflow: 'hidden', borderRadius: 2, border: '1px solid rgba(180,220,255,0.4)' }}>
      {/* Sky gradient behind glass */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #87CEEB 0%, #C8E8F8 60%, #E8F4FF 100%)' }} />
      {/* Glass tint */}
      <div style={{ position: 'absolute', inset: 0, background: WALL_WINDOW_PANE }} />
      {/* Open blind slats (horizontal lines spaced out = open) */}
      {[0.15, 0.30, 0.45, 0.60, 0.75].map((pct, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, right: 0,
          top: `${pct * 100}%`, height: 1,
          background: 'rgba(220,230,240,0.55)',
        }} />
      ))}
      {/* Light shaft */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,240,200,0.12), transparent 70%)' }} />
      {/* Specular on glass */}
      <div style={{ position: 'absolute', left: 1, top: 1, width: 1, height: '60%', background: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
    </div>
  );
}

// Whiteboard — spans 3 columns; rendered as a single wider element
function Whiteboard({ panelH }: { panelH: number }) {
  const top = panelH * 0.08;
  const h   = panelH * 0.75;
  return (
    <div style={{
      position: 'absolute', left: 2, top, right: 2, height: h,
      background: '#F8F8F0', borderRadius: 2,
      border: '2px solid #C8C8B8',
      boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* Scribbles / diagram lines */}
      <div style={{ position: 'absolute', left: '10%', top: '15%', width: '30%', height: 1, background: '#4488CC', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '10%', top: '25%', width: '22%', height: 1, background: '#4488CC', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '15%', top: '38%', width: 5, height: 8, border: '1px solid #CC4444', background: 'transparent', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '30%', top: '38%', width: 5, height: 8, border: '1px solid #44AA44', background: 'transparent', opacity: 0.7 }} />
      {/* Arrow */}
      <div style={{ position: 'absolute', left: '23%', top: '41%', width: '7%', height: 1, background: '#888', opacity: 0.6 }} />
      {/* More scribble text lines */}
      <div style={{ position: 'absolute', left: '50%', top: '15%', width: '35%', height: 1, background: '#333', opacity: 0.15 }} />
      <div style={{ position: 'absolute', left: '50%', top: '24%', width: '28%', height: 1, background: '#333', opacity: 0.12 }} />
      <div style={{ position: 'absolute', left: '50%', top: '33%', width: '32%', height: 1, background: '#333', opacity: 0.12 }} />
      <div style={{ position: 'absolute', left: '50%', top: '42%', width: '20%', height: 1, background: '#333', opacity: 0.10 }} />
      {/* Colored marker dot accents */}
      <div style={{ position: 'absolute', left: '12%', top: '62%', width: 3, height: 3, borderRadius: '50%', background: '#EE4444', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '22%', top: '62%', width: 3, height: 3, borderRadius: '50%', background: '#4444EE', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '32%', top: '62%', width: 3, height: 3, borderRadius: '50%', background: '#44BB44', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '10%', top: '75%', width: '55%', height: 1, background: '#FF8844', opacity: 0.35 }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface OfficeWallsProps {
  originX?: number;
  originY?: number;
}

// Whiteboard starts at this column and visually spans 3 panels
const WHITEBOARD_START = 19;

export function OfficeWalls({
  originX = NATURAL_ORIGIN_X,
  originY = NATURAL_ORIGIN_Y,
}: OfficeWallsProps) {
  return (
    <>
      {/* ── Back wall — row=0, right-face panels ── */}
      {Array.from({ length: GRID_COLS }, (_, col) => {
        const { left, top } = tileToScreen(col, 0, originX, originY);
        const panelH = WALL_PANEL_H;

        return (
          <div
            key={`bw-${col}`}
            style={{
              position: 'absolute',
              left: left + TILE_W / 2,
              top: top - WALL_H,
              width: TILE_W / 2,
              height: panelH,
              zIndex: -5,
              clipPath: CLIP_RIGHT,
              background: WALL_BACK_GRAD,
            }}
          >
            {/* Warm baseboard */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: WALL_BASEBOARD, borderRadius: 1 }} />

            {/* Windows with sky */}
            {WINDOW_COLS.has(col) && <WindowPane panelH={panelH} />}

            {/* Meme posters */}
            {POSTER_COLS.has(col) && <MemePosters panelH={panelH} />}

            {/* Notice board */}
            {col === NOTICEBOARD_COL && <NoticeBoard panelH={panelH} />}

            {/* Digital clock */}
            {col === CLOCK_COL && <DigitalClock panelH={panelH} />}

            {/* Whiteboard — rendered at start column, overflows into adjacent panels */}
            {col === WHITEBOARD_START && (
              <div style={{ position: 'absolute', left: 0, top: 0, width: TILE_W / 2 * 3, height: panelH, zIndex: 1, overflow: 'visible' }}>
                <Whiteboard panelH={panelH} />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Left wall — col=0, rows 8–15 (break room wall) ── */}
      {Array.from({ length: 8 }, (_, i) => {
        const row = 8 + i;
        const { left, top } = tileToScreen(0, row, originX, originY);
        return (
          <div
            key={`lw-${row}`}
            style={{
              position: 'absolute',
              left,
              top: top - WALL_H,
              width: TILE_W / 2,
              height: WALL_PANEL_H,
              zIndex: -5,
              clipPath: CLIP_LEFT,
              background: WALL_LEFT_GRAD,
            }}
          >
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: WALL_BASEBOARD, borderRadius: 1 }} />
          </div>
        );
      })}
    </>
  );
}
