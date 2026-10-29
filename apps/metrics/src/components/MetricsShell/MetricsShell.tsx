'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@ValenceUI/Link';
import { SiteFooter } from '@ValenceUI/SiteFooter';
import { SiteNav } from '@ValenceUI/SiteNav';
import { cn } from '@ValenceUI/cn';
import { MetricsLink } from '@ValenceMetrics/components/MetricsLink/MetricsLink';
import type { MetricsShellProps } from './MetricsShell.types';

const PLACES = [
  { href: '/', name: 'Statistics' },
  { href: '/about', name: 'About this data' },
] as const;

/**
 * What every page of the statistics site sits in: the bar every Valence site carries along the
 * top, the statistics' own two pages beneath it, and the footer every Valence site closes on.
 *
 * @param starCount - How many people have starred the project, where it is known.
 * @param children - The page.
 */
const MetricsShell = ({ starCount, children }: MetricsShellProps) => {
  const here = usePathname();

  return (
    <div className="relative z-0 flex min-h-dvh flex-col bg-[var(--frame-back)] text-text">
      <SiteNav here="metrics" pathname={here} InSiteLink={MetricsLink} starCount={starCount} />

      <nav
        aria-label="Pages"
        className="mx-auto flex w-full max-w-7xl items-center gap-1 px-4 pt-6 text-sm sm:px-6"
      >
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-16 sm:px-6">{children}</main>

      <SiteFooter here="metrics" InSiteLink={MetricsLink} logoSrc="/icon.png" />
    </div>
  );
};

MetricsShell.displayName = 'MetricsShell';

export { MetricsShell };
