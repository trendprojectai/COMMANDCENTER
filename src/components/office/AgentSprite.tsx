// src/components/office/AgentSprite.tsx
// Chunky Habbo Hotel-style pixel character with floating status bar.
// Status bar only visible when active (working at desk).
import { useState, useEffect } from 'react';
import { tileToScreen, spriteZIndex, objectZIndex, TILE_W, TILE_H } from '../../utils/isometric';

interface AgentSpriteProps {
  col: number;
  row: number;
  originX: number;
  originY: number;
  stageIndex: number;
  totalStages: number;
  color: string;
  agentName?: string;
  stages?: string[];
  taskName?: string;
  startedAt?: number | null;
  recentTasks?: { name: string; completedAt: string }[];
  hairColor?: string;
  skinColor?: string;
  hasGlasses?: boolean;
  hasHeadphones?: boolean;
  hasCap?: boolean;
  hasBeard?: boolean;
}

const SPRITE_W  = 24;
const SPRITE_H  = 36;
const TASKBAR_W = 100;

function fmtTime(s: number): string {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function AgentSprite({
  col,
  row,
  originX,
  originY,
  stageIndex,
  totalStages,
  color,
  agentName = 'AGENT-01',
  taskName,
  startedAt,
  recentTasks,
  hairColor = '#2A1A08',
  skinColor = '#C9956A',
  hasGlasses = false,
  hasHeadphones = false,
  hasCap = false,
  hasBeard = false,
}: AgentSpriteProps) {
  const { left: tileLeft, top: tileTop } = tileToScreen(col, row, originX, originY);

  const spriteLeft = tileLeft + TILE_W / 2 - SPRITE_W / 2;
  const spriteTop  = tileTop  + TILE_H / 2 - SPRITE_H;
  const TRANSFORM  = `translate(${spriteLeft}px, ${spriteTop}px)`;
  const TRANSITION = 'transform 600ms ease';

  const isActive = stageIndex > 0 && stageIndex <= totalStages;
  const progress = totalStages > 0 ? Math.min(stageIndex / totalStages, 1) : 0;
  // All desks are at row=1; when agent is sitting at any desk, use desk z-index
  const isAtDesk = row === 1 && isActive;
  const isIdle   = !isActive;

  // Z-index layers
  const normalZ = spriteZIndex(col, row);
  const bodyZ   = isAtDesk ? objectZIndex(col, row + 1) - 1 : normalZ;
  const headZ   = normalZ;

  // Shadow
  const shadowLeft = tileLeft + TILE_W / 2 - 16;
  const shadowTop  = tileTop  + TILE_H / 2 - 3;

  // Taskbar: floats above sprite head
  const taskbarLeft = spriteLeft + SPRITE_W / 2 - TASKBAR_W / 2;
  const taskbarTop  = spriteTop - 56;

  // Elapsed timer (counts UP from startedAt)
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!isActive || !startedAt) { setElapsedSec(0); return; }
    const update = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isActive, startedAt]);

  // Hover state for agent tooltip
  const [hovered, setHovered] = useState(false);

  // Hoodie color — a bit darker for pocket/shadow detail
  const hoodieColor = color;
  const pocketColor = color + 'BB';

  return (
    <>
      {/* ── Floor shadow ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 32,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          filter: 'blur(5px)',
          zIndex: bodyZ - 1,
          transform: `translate(${shadowLeft}px, ${shadowTop}px)`,
          transition: TRANSITION,
          pointerEvents: 'none',
        }}
      />

      {/* ── Body layer ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SPRITE_W,
          height: SPRITE_H,
          zIndex: bodyZ,
          transform: TRANSFORM,
          transition: TRANSITION,
          pointerEvents: 'none',
        }}
      >
        {/* Inner div carries animation — separate from positioning transform */}
        <div
          className={isAtDesk ? undefined : isIdle ? 'animate-bob animate-idle-sway' : 'animate-bob'}
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
        {/* Active aura */}
        {isActive && (
          <div
            className="animate-pulse-glow"
            style={{
              position: 'absolute',
              left: -10,
              top: -6,
              width: SPRITE_W + 20,
              height: SPRITE_H + 10,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${color}30 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Shoes (only when standing) */}
        {!isAtDesk && (
          <>
            <div style={{ position: 'absolute', left: 3, top: 32, width: 6, height: 4, background: '#1A1010', borderRadius: '0 0 2px 2px' }} />
            <div style={{ position: 'absolute', left: 14, top: 32, width: 6, height: 4, background: '#1A1010', borderRadius: '0 0 2px 2px' }} />
          </>
        )}

        {/* Jeans / Legs */}
        {!isAtDesk && (
          <>
            <div style={{ position: 'absolute', left: 4, top: 23, width: 5, height: 10, background: '#1E3060', borderRadius: '0 0 1px 1px' }} />
            <div style={{ position: 'absolute', left: 14, top: 23, width: 5, height: 10, background: '#1E3060', borderRadius: '0 0 1px 1px' }} />
          </>
        )}

        {/* Hoodie body */}
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: isAtDesk ? 18 : 14,
            width: 16,
            height: 14,
            background: hoodieColor,
            borderRadius: 3,
          }}
        >
          {/* Pocket detail */}
          <div style={{ position: 'absolute', left: 4, bottom: 2, width: 8, height: 3, background: pocketColor, borderRadius: 1 }} />
        </div>

        {/* Left arm */}
        <div
          style={{
            position: 'absolute',
            left: isAtDesk ? 0 : 0,
            top: isAtDesk ? 20 : 15,
            width: isAtDesk ? 8 : 4,
            height: isAtDesk ? 3 : 10,
            background: hoodieColor + 'CC',
            borderRadius: 2,
          }}
        />

        {/* Right arm */}
        <div
          style={{
            position: 'absolute',
            right: isAtDesk ? 0 : 0,
            top: isAtDesk ? 20 : 15,
            width: isAtDesk ? 8 : 4,
            height: isAtDesk ? 3 : 10,
            background: hoodieColor + 'CC',
            borderRadius: 2,
          }}
        />
        </div> {/* end animation inner div */}
      </div>

      {/* ── Head layer — always above desk ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SPRITE_W,
          height: SPRITE_H,
          zIndex: headZ,
          transform: TRANSFORM,
          transition: TRANSITION,
          pointerEvents: 'auto',
          cursor: recentTasks && recentTasks.length > 0 ? 'pointer' : 'default',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hair block — hidden when wearing a cap (cap renders its own top) */}
        {!hasCap && (
          <div
            style={{
              position: 'absolute',
              left: 6,
              top: 2,
              width: 12,
              height: 6,
              background: hairColor,
              borderRadius: '3px 3px 0 0',
            }}
          />
        )}

        {/* Cap (replaces hair) */}
        {hasCap && (
          <>
            {/* Cap crown */}
            <div style={{ position: 'absolute', left: 5, top: 1, width: 14, height: 6, background: color + 'CC', borderRadius: '3px 3px 0 0' }} />
            {/* Cap brim */}
            <div style={{ position: 'absolute', left: 4, top: 7, width: 16, height: 3, background: color + 'AA', borderRadius: '0 2px 2px 0' }} />
          </>
        )}

        {/* Headphones band (over hair/cap) */}
        {hasHeadphones && (
          <>
            {/* Band arc over top */}
            <div style={{ position: 'absolute', left: 4, top: -1, width: 16, height: 8, border: '3px solid #333344', borderRadius: '8px 8px 0 0', borderBottom: 'none', boxSizing: 'border-box' }} />
            {/* Left ear cup */}
            <div style={{ position: 'absolute', left: 3, top: 4, width: 5, height: 6, background: '#444466', borderRadius: 2 }} />
            {/* Right ear cup */}
            <div style={{ position: 'absolute', right: 3, top: 4, width: 5, height: 6, background: '#444466', borderRadius: 2 }} />
          </>
        )}

        {/* Head */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 5,
            width: 12,
            height: 12,
            background: skinColor,
            borderRadius: '50%',
          }}
        >
          {/* Left eye white */}
          <div style={{ position: 'absolute', left: 2, top: 4, width: 3, height: 3, background: '#FFFFFF', borderRadius: 1 }}>
            {/* Pupil */}
            <div style={{ position: 'absolute', left: 1, top: 1, width: 1, height: 1, background: '#1A0A00' }} />
          </div>
          {/* Right eye white */}
          <div style={{ position: 'absolute', left: 7, top: 4, width: 3, height: 3, background: '#FFFFFF', borderRadius: 1 }}>
            {/* Pupil */}
            <div style={{ position: 'absolute', left: 1, top: 1, width: 1, height: 1, background: '#1A0A00' }} />
          </div>
          {/* Mouth */}
          <div style={{ position: 'absolute', left: 4, top: 9, width: 4, height: 1, background: '#8A4A30', borderRadius: 1 }} />
          {/* Glasses */}
          {hasGlasses && (
            <>
              <div style={{ position: 'absolute', left: 1, top: 3, width: 4, height: 5, border: '1px solid #222233', borderRadius: 1, boxSizing: 'border-box' }} />
              <div style={{ position: 'absolute', left: 7, top: 3, width: 4, height: 5, border: '1px solid #222233', borderRadius: 1, boxSizing: 'border-box' }} />
              <div style={{ position: 'absolute', left: 5, top: 5, width: 2, height: 1, background: '#222233' }} />
            </>
          )}
          {/* Beard */}
          {hasBeard && (
            <div style={{ position: 'absolute', left: 1, top: 9, width: 10, height: 4, background: hairColor + 'CC', borderRadius: '0 0 4px 4px' }} />
          )}
        </div>

        {/* Hover tooltip — recent tasks */}
        {hovered && recentTasks && recentTasks.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: SPRITE_W / 2,
              top: -4,
              transform: 'translate(-50%, -100%)',
              background: '#0C0C1A',
              border: `1px solid ${color}55`,
              borderRadius: 8,
              padding: '6px 10px',
              pointerEvents: 'none',
              zIndex: 1000,
              minWidth: 130,
              boxShadow: `0 4px 14px rgba(0,0,0,0.7), 0 0 8px ${color}18`,
            }}
          >
            <div style={{
              fontSize: 7,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              color: color,
              letterSpacing: '0.12em',
              marginBottom: 4,
            }}>
              RECENT TASKS
            </div>
            {recentTasks.slice(0, 4).map((t, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', color: '#C8C8DC', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  · {t.name}
                </span>
                <span style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace', color: '#555570', flexShrink: 0 }}>
                  {new Date(t.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {/* Notch */}
            <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${color}55`, margin: '0 auto', marginTop: 4 }} />
            <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #0C0C1A', margin: '0 auto', marginTop: -8 }} />
          </div>
        )}
      </div>

      {/* ── Floating status bar — only when actively working ── */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: TASKBAR_W,
            zIndex: headZ + 10,
            transform: `translate(${taskbarLeft}px, ${taskbarTop}px)`,
            transition: TRANSITION,
            pointerEvents: 'none',
          }}
        >
          {/* Inner div carries appear animation — separate from positioning transform */}
          <div className="animate-taskbar-appear">
          {/* Main panel */}
          <div
            style={{
              background: '#0C0C1A',
              border: `2px solid ${color}66`,
              borderRadius: 10,
              padding: '5px 8px 6px',
              boxShadow: `0 4px 16px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 10px ${color}22`,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Row 1: agent name + status dot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 8,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                color: '#E8E8F0',
                letterSpacing: '0.10em',
                textTransform: 'uppercase' as const,
              }}>
                {agentName}
              </span>
              <div
                className="animate-dot-pulse"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 5px ${color}`,
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Row 2: task name (left) + elapsed timer (right) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <span style={{
                fontSize: 7,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                color: color,
                letterSpacing: '0.08em',
                textShadow: `0 0 6px ${color}88`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
                maxWidth: 58,
              }}>
                {taskName ?? 'WORKING...'}
              </span>
              <span
                className="animate-timer-tick"
                style={{
                  fontSize: 7,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#34D399',
                  letterSpacing: '0.06em',
                  textShadow: '0 0 5px rgba(52,211,153,0.6)',
                  flexShrink: 0,
                }}
              >
                {fmtTime(elapsedSec)}
              </span>
            </div>

            {/* Row 3: chunky progress bar */}
            <div style={{
              width: '100%',
              height: 5,
              background: '#1A1A2E',
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid #2A2A40',
            }}>
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${color}99, ${color}, ${color}BB, ${color})`,
                  backgroundSize: '200% 100%',
                  animation: 'progress-shimmer 1.6s linear infinite',
                  boxShadow: `0 0 6px ${color}88`,
                  transition: 'width 0.8s ease-in-out',
                }}
              />
            </div>
          </div>

          {/* Notch pointing down */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${color}66`,
            margin: '0 auto',
            marginTop: -1,
          }} />
          <div style={{
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #0C0C1A',
            margin: '0 auto',
            marginTop: -8,
          }} />
          </div> {/* end animation inner div */}
        </div>
      )}
    </>
  );
}
