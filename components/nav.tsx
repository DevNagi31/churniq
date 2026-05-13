'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Overview' },
  { href: '/cohorts', label: 'Cohorts' },
  { href: '/segments', label: 'Segments' },
  { href: '/clv', label: 'CLV' },
  { href: '/churn', label: 'Churn' },
  { href: '/campaigns', label: 'Campaigns' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 nav-blur">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6 text-[13px]">
        <Link href="/" className="flex items-center gap-2 font-medium tracking-tight text-ink-800">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-violet-500">
            <Activity className="h-3.5 w-3.5 text-white" />
          </span>
          <span>ChurnIQ</span>
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  active ? 'bg-ink-100 text-ink-800' : 'text-ink-600 hover:text-ink-800'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <span className="text-ink-400 text-xs hidden md:inline">Customer lifecycle analytics</span>
      </div>
    </header>
  );
}
