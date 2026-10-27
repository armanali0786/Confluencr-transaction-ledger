import { ArrowLeftRight, BookOpen, LayoutGrid } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { to: '/', label: 'Accounts', icon: LayoutGrid, end: true },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight, end: false },
];

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="rounded-lg bg-brand-600 p-1.5">
              <BookOpen className="size-4 text-white" aria-hidden />
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
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
