'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 text-[13.5px]">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[17px] font-bold tracking-tight text-ink-800"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan-glow font-display text-[15px] font-extrabold text-[#04141a]">
            ◐
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
                className={`rounded-full px-3.5 py-1.5 transition ${
                  active
                    ? 'bg-white/[0.08] text-ink-800'
                    : 'text-ink-400 hover:text-ink-800'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/cohorts"
          className="hidden rounded-lg bg-gradient-to-br from-accent to-teal-500 px-4 py-2 text-[13px] font-semibold text-[#04141a] transition-transform hover:-translate-y-0.5 md:inline-block"
        >
          Explore Data
        </Link>
      </div>
    </header>
  );
}
