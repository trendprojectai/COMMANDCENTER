import { Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent } from '../types';

interface QuickLaunchBarProps {
  agents: Agent[];
  onLaunch: (agent: Agent) => void;
  launching: string | null;
}

export function QuickLaunchBar({ agents, onLaunch, launching }: QuickLaunchBarProps) {
  if (agents.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {agents.map((agent) => {
        const isRunning = agent.status === 'running';
        const isLaunching = launching === agent.id;
        const isDisabled = isRunning || isLaunching;

        return (
          <motion.button
            key={agent.id}
            onClick={() => !isDisabled && onLaunch(agent)}
            disabled={isDisabled}
            whileTap={isDisabled ? {} : { scale: 0.97 }}
            className={[
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
              'border transition-all duration-200 select-none',
              isRunning
                ? 'border-running text-running bg-running/10 animate-pulse-amber cursor-default'
                : isLaunching
                ? 'border-accent/50 text-accent/70 bg-accent/5 cursor-wait'
                : 'border-border text-text-muted bg-surface hover:border-accent/60 hover:text-text-primary hover:bg-accent/5 cursor-pointer',
            ].join(' ')}
          >
            {isRunning || isLaunching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {agent.name}
            {isRunning && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-running animate-dot-pulse" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
