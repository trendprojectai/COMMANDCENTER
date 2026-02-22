import { Play, Loader2, Link, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Agent } from '../types';
import { relativeTime } from '../utils/time';

const STATUS_CONFIG = {
  idle: { dot: 'bg-idle', label: 'Idle', text: 'text-idle' },
  running: { dot: 'bg-running animate-dot-pulse', label: 'Running', text: 'text-running' },
  cancelling: { dot: 'bg-amber-500/60 animate-pulse', label: 'Cancelling…', text: 'text-amber-400/70' },
  complete: { dot: 'bg-success', label: 'Complete', text: 'text-success' },
  failed: { dot: 'bg-failed', label: 'Failed', text: 'text-failed' },
} as const;

interface AgentCardProps {
  agent: Agent;
  onRun: (agent: Agent) => void;
  onCancel?: (agentId: string) => void;
  onWebhookSave?: (agentId: string, url: string) => void;
  launching: boolean;
}

export function AgentCard({ agent, onRun, onCancel, onWebhookSave, launching }: AgentCardProps) {
  const { dot, label, text } = STATUS_CONFIG[agent.status];
  const isRunning = agent.status === 'running';
  const isCancelling = agent.status === 'cancelling';
  const isDisabled = isRunning || launching || isCancelling;

  const [editingWebhook, setEditingWebhook] = useState(false);
  const [webhookInput, setWebhookInput] = useState(agent.webhook_url);

  function commitWebhook() {
    const trimmed = webhookInput.trim();
    onWebhookSave?.(agent.id, trimmed);
    setEditingWebhook(false);
  }

  return (
    <motion.div
      layout
      className={[
        'relative flex flex-col p-5 rounded-card border bg-surface',
        'transition-all duration-300',
        isRunning ? 'border-running/50 animate-pulse-amber' : 'border-border hover:border-border/80',
      ].join(' ')}
      style={isCancelling ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
    >
      {agent.status === 'running' && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCancel?.(agent.id); }}
          title="Cancel workflow"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 18,
            height: 18,
            background: '#ff3b30',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ff1f1f'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ff3b30'; }}
        >
          ✕
        </button>
      )}
      <div className="flex items-center justify-between">
        {/* Left: info */}
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="text-text-primary font-semibold text-sm leading-tight truncate">
            {agent.name}
          </h3>

          {/* Status badge */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
            <span className={`text-xs font-medium ${text}`}>{label}</span>
          </div>

          {/* Stage indicator when running */}
          {isRunning && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {agent.stages.map((stage) => (
                <span
                  key={stage}
                  className="text-xs px-1.5 py-0.5 rounded bg-border text-text-muted font-mono"
                >
                  {stage}
                </span>
              ))}
            </div>
          )}

          {/* Last run */}
          <p className="text-xs text-text-muted">
            Last run: {relativeTime(agent.last_run_at)}
          </p>
        </div>

        {/* Right: Run button */}
        <button
          onClick={() => !isDisabled && onRun(agent)}
          disabled={isDisabled}
          className={[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold',
            'border transition-all duration-200 ml-4 flex-shrink-0',
            isDisabled
              ? 'border-border/40 text-text-muted/40 cursor-not-allowed bg-transparent'
              : 'border-accent text-accent hover:bg-accent hover:text-bg cursor-pointer',
          ].join(' ')}
        >
          {launching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Running' : launching ? 'Starting' : 'Run'}
        </button>
      </div>

      {/* Webhook URL row */}
      <div className="mt-3 pt-3 border-t border-border/50">
        {editingWebhook ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="url"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitWebhook();
                if (e.key === 'Escape') setEditingWebhook(false);
              }}
              placeholder="https://your-n8n-instance/webhook/..."
              className="flex-1 bg-bg border border-accent/40 rounded px-2 py-1 text-xs text-text-primary font-mono outline-none focus:border-accent placeholder:text-text-muted/50"
            />
            <button
              onClick={commitWebhook}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-accent/50 text-accent hover:bg-accent hover:text-bg transition-colors"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setWebhookInput(agent.webhook_url);
              setEditingWebhook(true);
            }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <Link className="w-3 h-3 flex-shrink-0" />
            <span className="font-mono truncate max-w-[260px]">
              {agent.webhook_url || 'Set webhook URL…'}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Skeleton card for loading state
export function AgentCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-5 rounded-card border border-border bg-surface animate-pulse">
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-40 bg-border rounded" />
        <div className="h-3 w-20 bg-border rounded" />
        <div className="h-3 w-28 bg-border rounded" />
      </div>
      <div className="h-9 w-20 bg-border rounded-lg ml-4" />
    </div>
  );
}
