'use client';

import { usePathname } from 'next/navigation';
import { Badge } from '@ValenceUI/Badge';
import { Link } from '@ValenceUI/Link';
import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';
import { SOURCE_URL } from '@ValenceMetrics/constants/SOURCE_URL';
import { TELEMETRY_DOCS_URL } from '@ValenceMetrics/constants/TELEMETRY_DOCS_URL';
import type { MetricsShellProps } from './MetricsShell.types';

const PLACES = [
  { href: '/', name: 'Statistics' },
  { href: '/about', name: 'About this data' },
] as const;

/**
 * What every page of the statistics site sits in: the mark and the places along the top, and
 * where the code and the documentation are along the bottom.
 *
 * @param children - The page.
 */
const MetricsShell = ({ children }: MetricsShellProps) => {
  const here = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-5 pb-3 sm:px-6">
        <Link
          href="/"
          look="bare"
          label="Valence statistics"
          className="flex items-center gap-2.5 rounded-lg"
        >
          <Logo size={26} isSolid />
          <span className="text-lg font-semibold tracking-tight text-text">Valence</span>
          <Badge tone="quiet" size="sm">
            Statistics
          </Badge>
        </Link>

        <nav aria-label="Pages" className="flex items-center gap-1 text-sm">
          {PLACES.map(({ href, name }) => (
            <Link
              key={href}
              href={href}
              look="bare"
              isCurrent={here === href}
              className={cn(
                'rounded-lg px-3 py-1.5 font-medium transition-colors hover:bg-[var(--surface-hover)]',
                here === href ? 'bg-[var(--surface-active)] text-text' : 'text-text-muted',
              )}
            >
              {name}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-12 sm:px-6">{children}</main>

      <footer className="border-t border-[var(--surface-line)]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-text-muted sm:px-6">
          <p>Valence is open source and MIT licensed. The figures refresh every five minutes.</p>

          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href={TELEMETRY_DOCS_URL}>What is sent</Link>
            <Link href={SOURCE_URL}>The code for this site</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

MetricsShell.displayName = 'MetricsShell';

export { MetricsShell };
