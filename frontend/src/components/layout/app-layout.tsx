import { ArrowLeftRight, BookOpen, LayoutGrid } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { cn } from '@/lib/cn';

import { GradientMesh } from './gradient-mesh';

const NAV_ITEMS = [
  { to: '/', label: 'Accounts', icon: LayoutGrid, end: true },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight, end: false },
];

export function AppLayout() {
  return (
    <div className="relative isolate min-h-screen">
      <GradientMesh />
      <header className="sticky top-0 z-30 border-b border-hairline/60 bg-canvas/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-heading-sm text-ink">
            <span className="rounded-md bg-primary p-1.5 shadow-level-1">
              <BookOpen className="size-4 text-on-primary" aria-hidden />
            </span>
            Ledger
          </Link>
          <nav aria-label="Main" className="flex gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-button-sm transition-colors',
                    isActive
                      ? 'bg-canvas text-primary shadow-level-1'
                      : 'text-ink-mute-2 hover:bg-canvas/70 hover:text-ink',
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
