import { NavLink } from 'react-router-dom';
import { Bot, Film, LayoutDashboard, Zap, List } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Analytics' },
  { to: '/office', icon: Bot, label: 'Agents' },
  { to: '/tasks', icon: List, label: 'Tasks' },
  { to: '/videos', icon: Film, label: 'Videos' },
];

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-[220px] flex-shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-6">
        <Zap className="h-5 w-5 fill-accent text-accent" strokeWidth={0} />
        <span className="text-sm font-semibold tracking-wider text-text-primary">GBOT</span>
      </div>

      <nav className="flex flex-1 flex-col pt-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'relative flex items-center gap-3 px-5 py-2.5 text-sm transition-colors',
                isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-primary',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full transition-all',
                    isActive ? 'h-5 bg-accent' : 'h-0 bg-transparent',
                  ].join(' ')}
                />
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="font-mono text-xs text-text-muted">v0.1.0 · Phase 1</p>
      </div>
    </aside>
  );
}
