// src/components/office/LiveLogPanel.tsx
import { useRef, useEffect } from 'react';
import { useActivity } from '../../hooks/useActivity';
import type { ActivityEntry } from '../../types';

export interface LogLine {
  message: string;
  level: 'info' | 'success' | 'error';
  timestamp: string;
}

interface LiveLogPanelProps {
  logs?: LogLine[];
}

function dotColor(level: LogLine['level']): string {
  if (level === 'success') return '#34D399';
  if (level === 'error') return '#EF4444';
  return '#4A4A6A';
}

function textColor(level: LogLine['level']): string {
  if (level === 'success') return '#34D399';
  if (level === 'error') return '#EF4444';
  return '#8888AA';
}

function isStageHeader(msg: string): boolean {
  return msg.startsWith('[STAGE:');
}

function parseStageHeader(msg: string): string {
  const m = msg.match(/^\[STAGE:\s*(.+?)\]$/);
  return m ? m[1] : msg;
}

export function LiveLogPanel({ logs: logsProp }: LiveLogPanelProps) {
  const { activity } = useActivity(30);
  const bottomRef = useRef<HTMLDivElement>(null);

  const entries: LogLine[] = logsProp ?? activity.map((e: ActivityEntry) => ({
    message: e.message,
    level: e.level,
    timestamp: e.timestamp,
  }));

  const entryCount = entries.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entryCount]);

  const displayed = [...entries].reverse();

  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        background: '#08080E',
        borderLeft: '1px solid #1A1A2A',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid #1A1A2A',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          className="animate-dot-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#34D399',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 500,
            letterSpacing: '0.2em',
            color: '#4A4A6A',
            textTransform: 'uppercase' as const,
          }}
        >
          Live Log
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#2A2A3A',
          }}
        >
          {entries.length} entries
        </span>
      </div>

      {/* Entries */}
      <div
        className="scrollbar-dark"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {displayed.length === 0 ? (
          <p
            style={{
              padding: '16px',
              fontSize: 11,
              color: '#2A2A3A',
              fontFamily: 'JetBrains Mono, monospace',
              margin: 0,
            }}
          >
            — waiting for run —
          </p>
        ) : (
          displayed.map((entry, i) => {
            if (isStageHeader(entry.message)) {
              return (
                <div
                  key={i}
                  style={{
                    padding: '6px 14px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: '#F5A62322' }} />
                  <span
                    style={{
                      fontSize: 8,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      color: '#F5A623',
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    {parseStageHeader(entry.message)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#F5A62322' }} />
                </div>
              );
            }

            return (
              <div
                key={i}
                style={{
                  padding: '7px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  borderBottom: '1px solid rgba(26,26,42,0.6)',
                }}
              >
                {/* Level dot */}
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: dotColor(entry.level),
                    marginTop: 4,
                    flexShrink: 0,
                    boxShadow:
                      entry.level === 'success'
                        ? '0 0 6px rgba(52,211,153,0.5)'
                        : entry.level === 'error'
                        ? '0 0 6px rgba(239,68,68,0.5)'
                        : 'none',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 11,
                      color: textColor(entry.level),
                      fontFamily: 'JetBrains Mono, monospace',
                      lineHeight: 1.5,
                      wordBreak: 'break-word' as const,
                      margin: 0,
                    }}
                  >
                    {entry.message}
                  </p>
                  <time
                    dateTime={entry.timestamp}
                    style={{
                      fontSize: 9,
                      color: '#2A2A3A',
                      fontFamily: 'JetBrains Mono, monospace',
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    {new Date(entry.timestamp).toLocaleTimeString('en-GB')}
                  </time>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer gradient fade */}
      <div
        style={{
          height: 24,
          background: 'linear-gradient(to bottom, transparent, #08080E)',
          flexShrink: 0,
          pointerEvents: 'none',
          marginTop: -24,
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  );
}
