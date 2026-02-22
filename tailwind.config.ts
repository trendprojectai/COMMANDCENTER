import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#12121A',
        border: '#1E1E2E',
        accent: '#F5A623',
        'text-primary': '#F0F0F0',
        'text-muted': '#8888AA',
        idle: '#6B7280',
        running: '#F59E0B',
        success: '#34D399',
        failed: '#EF4444',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      animation: {
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'dot-pulse': 'dot-pulse 1.5s ease-in-out infinite',
        'bob': 'bob 1.6s ease-in-out infinite',
        'led-blink': 'led-blink 0.6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'walk-bounce': 'walk-bounce 0.4s ease-in-out infinite',
        'monitor-glow': 'monitor-glow 1.8s ease-in-out infinite',
        'progress-shimmer': 'progress-shimmer 1.6s linear infinite',
        'taskbar-appear': 'taskbar-appear 0.25s ease-out forwards',
        // Habbo Hotel additions
        'fish-swim':   'fish-swim 3s ease-in-out infinite',
        'fish-swim-b': 'fish-swim-b 4.2s ease-in-out infinite',
        'fish-swim-c': 'fish-swim-c 5s ease-in-out infinite',
        'tank-bubble': 'tank-bubble 2s ease-in infinite',
        'active-ring': 'active-ring 2.5s ease-in-out infinite',
        // New additions
        'matrix-fall':  'matrix-fall 1.2s linear infinite',
        'coffee-steam': 'coffee-steam 2.2s ease-out infinite',
        'vending-glow': 'vending-glow 1.8s ease-in-out infinite',
        'idle-sway':    'idle-sway 3.5s ease-in-out infinite',
        'timer-tick':   'timer-tick 1s step-end infinite',
        'notif-appear': 'notif-appear 0.3s ease-out forwards',
        // Black cat wandering
        'cat-walk':       'cat-walk 0.5s ease-in-out infinite',
        'cat-tail-swish': 'cat-tail-swish 1.5s ease-in-out infinite',
        'cat-tail-walk':  'cat-tail-walk 0.5s ease-in-out infinite',
        'cat-blink':      'cat-blink 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 166, 35, 0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(245, 166, 35, 0.2)' },
        },
        'dot-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'bob': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'led-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'walk-bounce': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-1.5px)' },
        },
        'monitor-glow': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(122,158,200,0.3)' },
          '50%': { boxShadow: '0 0 14px rgba(122,158,200,0.7)' },
        },
        'progress-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'taskbar-appear': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // Fish swimming (horizontal flip mid-loop to reverse direction)
        'fish-swim': {
          '0%':   { transform: 'translateX(0px) scaleX(1)' },
          '45%':  { transform: 'translateX(14px) scaleX(1)' },
          '50%':  { transform: 'translateX(14px) scaleX(-1)' },
          '95%':  { transform: 'translateX(0px) scaleX(-1)' },
          '100%': { transform: 'translateX(0px) scaleX(1)' },
        },
        'fish-swim-b': {
          '0%':   { transform: 'translateX(4px) scaleX(-1)' },
          '45%':  { transform: 'translateX(-10px) scaleX(-1)' },
          '50%':  { transform: 'translateX(-10px) scaleX(1)' },
          '95%':  { transform: 'translateX(4px) scaleX(1)' },
          '100%': { transform: 'translateX(4px) scaleX(-1)' },
        },
        // Rising bubble
        'tank-bubble': {
          '0%':   { transform: 'translateY(0px)', opacity: '0.8' },
          '100%': { transform: 'translateY(-12px)', opacity: '0' },
        },
        // Pulsing active-station ring on WS-01
        'active-ring': {
          '0%, 100%': { boxShadow: '0 0 0 2px rgba(255,220,80,0.4), 0 0 8px rgba(255,220,80,0.2)' },
          '50%':      { boxShadow: '0 0 0 4px rgba(255,220,80,0.7), 0 0 16px rgba(255,220,80,0.4)' },
        },
        // Fish 3 — pink, opposite of fish-swim-b timing
        'fish-swim-c': {
          '0%':   { transform: 'translateX(2px) scaleX(1)' },
          '45%':  { transform: 'translateX(-8px) scaleX(1)' },
          '50%':  { transform: 'translateX(-8px) scaleX(-1)' },
          '95%':  { transform: 'translateX(2px) scaleX(-1)' },
          '100%': { transform: 'translateX(2px) scaleX(1)' },
        },
        // Matrix rain columns on active monitors
        'matrix-fall': {
          '0%':   { transform: 'translateY(-100%)', opacity: '1' },
          '80%':  { opacity: '0.8' },
          '100%': { transform: 'translateY(200%)', opacity: '0' },
        },
        // Coffee machine steam wisp
        'coffee-steam': {
          '0%':   { transform: 'translateY(0px) scaleX(1)', opacity: '0.7' },
          '50%':  { transform: 'translateY(-6px) scaleX(1.4)', opacity: '0.35' },
          '100%': { transform: 'translateY(-12px) scaleX(0.7)', opacity: '0' },
        },
        // Vending machine neon button glow
        'vending-glow': {
          '0%, 100%': { opacity: '0.7' },
          '50%':      { opacity: '1' },
        },
        // Idle agent subtle sway
        'idle-sway': {
          '0%, 100%': { transform: 'translateX(0px)' },
          '30%':      { transform: 'translateX(-1px)' },
          '70%':      { transform: 'translateX(1px)' },
        },
        // Status bar elapsed timer tick (subtle)
        'timer-tick': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        // Completion notification appear
        'notif-appear': {
          '0%':   { opacity: '0', transform: 'scale(0.85) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // Black cat — body bob while walking
        'cat-walk': {
          // A cat-like "slink": subtle down-up with a tiny shoulder roll.
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%':      { transform: 'translateY(0.6px) rotate(0.8deg)' },
          '50%':      { transform: 'translateY(-1.2px) rotate(0deg)' },
          '75%':      { transform: 'translateY(0.6px) rotate(-0.8deg)' },
        },
        // Cat tail — slow swish at rest
        'cat-tail-swish': {
          '0%, 100%': { transform: 'rotate(20deg)'  },
          '50%':      { transform: 'rotate(-20deg)' },
        },
        // Cat tail — quick jerk while walking
        'cat-tail-walk': {
          '0%, 100%': { transform: 'rotate(30deg)' },
          '50%':      { transform: 'rotate(60deg)' },
        },
        // Cat eye blink — periodic slow blink
        'cat-blink': {
          '0%, 86%, 94%, 100%': { transform: 'scaleY(1)'   },
          '90%':                { transform: 'scaleY(0.1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
