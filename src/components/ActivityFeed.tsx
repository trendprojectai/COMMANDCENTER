import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityEntry } from '../types';
import { formatTime } from '../utils/time';

const LEVEL_CONFIG = {
  info: { dot: 'bg-idle', text: 'text-text-muted' },
  success: { dot: 'bg-success', text: 'text-success' },
  error: { dot: 'bg-failed', text: 'text-failed' },
} as const;

interface ActivityFeedProps {
  entries: ActivityEntry[];
  loading: boolean;
}

export function ActivityFeed({ entries, loading }: ActivityFeedProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Activity</h2>
        {loading && (
          <span className="text-xs text-text-muted animate-pulse">Loading…</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-dark space-y-1 pr-1">
        {!loading && entries.length === 0 && (
          <p className="text-text-muted text-sm py-8 text-center">No activity yet</p>
        )}

        <AnimatePresence initial={false}>
          {entries.map((entry, i) => {
            const { dot, text } = LEVEL_CONFIG[entry.level];
            const key = `${entry.timestamp}-${i}`;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg hover:bg-surface/60 group"
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className={`text-xs leading-relaxed ${text || 'text-text-muted'}`}>
                    {entry.message}
                  </p>
                  <time className="font-mono text-[10px] text-text-muted/60">
                    {formatTime(entry.timestamp)}
                  </time>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
