// src/components/office/CatSprite.tsx
// A cute black cat that wanders around the office.
// Rendered as layered CSS divs following the same isometric pattern as AgentSprite.
import { tileToScreen, spriteZIndex, TILE_W, TILE_H } from '../../utils/isometric';

interface CatSpriteProps {
  col:        number;
  row:        number;
  originX:    number;
  originY:    number;
  isWalking:  boolean;
  isSitting:  boolean;
  facingLeft: boolean;
}

// ── Cat color palette ─────────────────────────────────────────────────────────
const CAT_BLACK  = '#0F0F0F';
const CAT_DARK   = '#0A0A0A';
const EYE_GREEN  = '#6EFF6E';
const EAR_PINK   = '#FF9EA8';
const NOSE_PINK  = '#FFB3C1';
const WHISKER_C  = 'rgba(210,210,210,0.75)';

// ── Sprite dimensions ─────────────────────────────────────────────────────────
const SPRITE_W = 22;
const SPRITE_H = 24;

// ── Ear triangle helper ───────────────────────────────────────────────────────
function Ear({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <div style={{ position: 'absolute', top: -5, [isLeft ? 'left' : 'right']: -1 }}>
      {/* Outer ear (black) */}
      <div style={{
        width: 0, height: 0,
        borderLeft:   '4px solid transparent',
        borderRight:  '4px solid transparent',
        borderBottom: `7px solid ${CAT_BLACK}`,
      }} />
      {/* Inner ear (pink) — offset slightly */}
      <div style={{
        position: 'absolute', top: 2, left: 1,
        width: 0, height: 0,
        borderLeft:   '2.5px solid transparent',
        borderRight:  '2.5px solid transparent',
        borderBottom: `4px solid ${EAR_PINK}`,
      }} />
    </div>
  );
}

// ── Eye helper ────────────────────────────────────────────────────────────────
function Eye({ delay = '0s' }: { delay?: string }) {
  return (
    <div
      className="animate-cat-blink"
      style={{
        width: 3.5, height: 3.5,
        background: EYE_GREEN,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animationDelay: delay,
        // Subtle cat eye glow
        boxShadow: `0 0 3px ${EYE_GREEN}99`,
      }}
    >
      {/* Pupil */}
      <div style={{ width: 1.5, height: 1.5, background: '#050505', borderRadius: '50%' }} />
    </div>
  );
}

// ── Tail helper ───────────────────────────────────────────────────────────────
function Tail({ isWalking, isSitting }: { isWalking: boolean; isSitting: boolean }) {
  if (isSitting) {
    // Sitting: tail curls to the side along the floor
    return (
      <div style={{
        position: 'absolute',
        right: -3, bottom: 3,
        width: 13, height: 4,
        background: CAT_BLACK,
        borderRadius: '0 4px 4px 0',
      }} />
    );
  }

  // Standing / walking: tail rises upward, animated
  return (
    <div
      className={isWalking ? 'animate-cat-tail-walk' : 'animate-cat-tail-swish'}
      style={{
        position: 'absolute',
        right: 1, top: 7,
        width: 3, height: 14,
        background: CAT_BLACK,
        borderRadius: '3px 3px 0 0',
        transformOrigin: 'bottom center',
        transform: 'rotate(20deg)',
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CatSprite({
  col, row, originX, originY,
  isWalking, isSitting, facingLeft,
}: CatSpriteProps) {
  const { left: tileLeft, top: tileTop } = tileToScreen(col, row, originX, originY);

  // Center sprite on tile, feet at tile-center vertical
  const spriteLeft = tileLeft + TILE_W / 2 - SPRITE_W / 2;
  const spriteTop  = tileTop  + TILE_H / 2 - SPRITE_H;
  // Important: keep mirroring (scaleX) separate from positioning (translate).
  // Combining them in a single transform can invert the translate when facing flips,
  // which makes the sprite "disappear" off-screen for a frame.
  const POSITION_TRANSFORM = `translate(${spriteLeft}px, ${spriteTop}px)`;
  const TRANSITION = 'transform 300ms cubic-bezier(0.2, 0.9, 0.2, 1)';

  const zIndex    = spriteZIndex(col, row);
  const shadowZ   = zIndex - 1;

  // Shadow (separate element so it's not affected by scaleX)
  const shadowLeft = tileLeft + TILE_W / 2 - 10;
  const shadowTop  = tileTop  + TILE_H / 2 - 3;

  return (
    <>
      {/* ── Floor shadow ── */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: isSitting ? 16 : 18,
          height: 5,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(3px)',
          zIndex: shadowZ,
          transform: `translate(${shadowLeft}px, ${shadowTop}px)`,
          transition: TRANSITION,
          pointerEvents: 'none',
        }}
      />

      {/* ── Cat sprite ── */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: SPRITE_W, height: SPRITE_H,
          zIndex,
          transform: POSITION_TRANSFORM,
          transition: TRANSITION,
          pointerEvents: 'none',
        }}
      >
        {/* Mirror wrapper keeps facing changes from affecting positioning. */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: facingLeft ? 'scaleX(-1)' : 'none',
            transformOrigin: 'center',
          }}
        >
          {/* Gait wrapper: gives the whole cat a subtle slink while walking. */}
          <div
            className={isWalking && !isSitting ? 'animate-cat-walk' : undefined}
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            {/* Tail (rendered first so it appears behind body) */}
            <Tail isWalking={isWalking} isSitting={isSitting} />

            {/* Body */}
            <div
              style={{
                position: 'absolute',
                left: 3,
                top: isSitting ? 8 : 12,
                width: isSitting ? 14 : 15,
                height: isSitting ? 14 : 8,
                background: CAT_BLACK,
                borderRadius: isSitting ? '50%' : '4px 4px 3px 3px',
              }}
            >
              {/* Front paws when sitting */}
              {isSitting && (
                <>
                  <div style={{
                    position: 'absolute', bottom: -4, left: 1.5,
                    width: 4.5, height: 5,
                    background: CAT_DARK,
                    borderRadius: '40% 40% 50% 50%',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -4, right: 1.5,
                    width: 4.5, height: 5,
                    background: CAT_DARK,
                    borderRadius: '40% 40% 50% 50%',
                  }} />
                </>
              )}
            </div>

            {/* Legs — only when standing/walking */}
            {!isSitting && (
              <div style={{ position: 'absolute', top: 18, left: 2, width: 18, height: 7 }}>
                {/* Cat gait: diagonal pairs (front-left + back-right), then (front-right + back-left). */}
                <div
                  className={isWalking ? 'animate-cat-walk' : undefined}
                  style={{ position: 'absolute', left: 1, top: 0, width: 3, height: 6, background: CAT_DARK, borderRadius: '0 0 2px 2px', animationDelay: '0ms' }}
                />
                <div
                  className={isWalking ? 'animate-cat-walk' : undefined}
                  style={{ position: 'absolute', right: 1, top: 0, width: 3, height: 6, background: CAT_DARK, borderRadius: '0 0 2px 2px', animationDelay: '0ms' }}
                />
                <div
                  className={isWalking ? 'animate-cat-walk' : undefined}
                  style={{ position: 'absolute', left: 5.5, top: 0, width: 3, height: 6, background: CAT_DARK, borderRadius: '0 0 2px 2px', animationDelay: '250ms' }}
                />
                <div
                  className={isWalking ? 'animate-cat-walk' : undefined}
                  style={{ position: 'absolute', right: 5.5, top: 0, width: 3, height: 6, background: CAT_DARK, borderRadius: '0 0 2px 2px', animationDelay: '250ms' }}
                />
              </div>
            )}

            {/* Head */}
            <div
              style={{
                position: 'absolute',
                left: 4,
                top: isSitting ? 0 : 1,
                width: 13,
                height: 12,
                background: CAT_BLACK,
                borderRadius: '50%',
              }}
            >
              <Ear side="left" />
              <Ear side="right" />

              {/* Eyes */}
              <div style={{ position: 'absolute', top: 4, left: 1.5 }}>
                <Eye delay="0s" />
              </div>
              <div style={{ position: 'absolute', top: 4, right: 1.5 }}>
                <Eye delay="0.15s" />
              </div>

              {/* Nose */}
              <div style={{
                position: 'absolute', top: 8, left: '50%',
                transform: 'translateX(-50%)',
                width: 2.5, height: 1.5,
                background: NOSE_PINK,
                borderRadius: 1,
              }} />

              {/* Whiskers — left side */}
              <div style={{ position: 'absolute', top: 7, left: -7, width: 7, height: 1, background: WHISKER_C, borderRadius: 1 }} />
              <div style={{ position: 'absolute', top: 8.5, left: -6, width: 6, height: 1, background: WHISKER_C, borderRadius: 1, transform: 'rotate(12deg)' }} />
              {/* Whiskers — right side */}
              <div style={{ position: 'absolute', top: 7, right: -7, width: 7, height: 1, background: WHISKER_C, borderRadius: 1 }} />
              <div style={{ position: 'absolute', top: 8.5, right: -6, width: 6, height: 1, background: WHISKER_C, borderRadius: 1, transform: 'rotate(-12deg)' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
