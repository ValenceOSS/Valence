import { Link, Outlet } from '@tanstack/react-router';
import { SiteFooter } from '@ValenceUI/SiteFooter';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import { DocsTopBar } from '@ValenceDocs/components/DocsTopBar/DocsTopBar';

/**
 * Links the footer to one of the documentation's own pages without reloading it.
 *
 * @param props - Where to, how it looks and what it says.
 */
const DocsLink = ({ to, className, children }: InSiteLinkProps) => (
  <Link to={to} className={className}>
    {children}
  </Link>
);

/**
 * The frame every page sits in: the bar floating across the top, and the page beneath it on the
 * darker grey every Valence site shares, its parts laid out as cards, and the footer every
 * Valence site closes on.
 */
const DocsShell = () => (
  <div className="flex min-h-dvh flex-col overflow-x-clip bg-[var(--frame-back)] text-text">
    <DocsTopBar />

    <main className="flex-1">
      <Outlet />
    </main>

    <SiteFooter here="docs" InSiteLink={DocsLink} />
  </div>
);

DocsShell.displayName = 'DocsShell';

export { DocsShell };
