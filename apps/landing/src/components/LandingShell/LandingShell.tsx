import { Suspense, useEffect } from 'react';
import { keepCanonical } from '@ValenceLanding/components/LandingShell/keepCanonical';
import { Link, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { LandingNav } from '@ValenceLanding/components/LandingNav/LandingNav';
import { SiteCursor } from '@ValenceLanding/components/SiteCursor/SiteCursor';
import { SiteFooter } from '@ValenceUI/SiteFooter';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import { pageFor } from '@ValenceLanding/components/LandingShell/pageFor';
import { PagePathnameContext } from '@ValenceLanding/components/LandingShell/PagePathnameContext';
import { pageVariants } from './pageVariants';

/**
 * Links the footer to one of this site's own pages without reloading it.
 *
 * @param props - Where to, how it looks and what it says.
 */
const LandingLink = ({ to, className, children }: InSiteLinkProps) => (
  <Link to={to} className={className}>
    {children}
  </Link>
);

/**
 * What every page on getvalence.app sits inside: the nav, with the line about the newest release
 * across its top, the footer, and one page blurring away as the next rises into focus.
 *
 * The page shown is looked up here and rendered directly rather than through `Outlet`. `Outlet`
 * stays subscribed to the router's current match even while `AnimatePresence` is still playing its
 * exit — so the page fading out would silently swap to the page fading in partway through, rather
 * than finishing its own exit undisturbed. A plain looked-up component has no such subscription: once
 * `AnimatePresence` stops asking this component to re-render it, it just sits still until removed.
 * A page that reads its own address does so through `usePagePathname`, which hands it the address
 * held here rather than the router's, for the same reason. A page whose code is still on the way
 * holds the footer down until it comes, then rises in whole.
 */
const LandingShell = () => {
  const pathname = useRouterState({
    select: (state) => (state.resolvedLocation ?? state.location).pathname,
  });
  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    keepCanonical(pathname);
  }, [pathname]);
  const isUiLibrary = pathname.startsWith('/ui/');
  const Page = pageFor(pathname);

  return (
    <div className="relative z-0 flex min-h-dvh flex-col bg-[var(--frame-back)] text-text">
      <LandingNav />

      <AnimatePresence mode="wait">
        <Suspense key={isUiLibrary ? '/ui' : pathname} fallback={<div className="min-h-dvh" />}>
          <motion.main
            variants={pageVariants(prefersReducedMotion === true)}
            initial="hidden"
            animate="shown"
            exit="gone"
            className="flex-1"
          >
            <PagePathnameContext value={pathname}>
              {/* oxlint-disable-next-line react/static-components -- pageFor hands back module-level components, the same one for an address every time. */}
              <Page />
            </PagePathnameContext>
          </motion.main>
        </Suspense>
      </AnimatePresence>

      <SiteFooter here="landing" InSiteLink={LandingLink} logoSrc="/valence-icon.png" />

      <SiteCursor />
    </div>
  );
};

LandingShell.displayName = 'LandingShell';

export { LandingShell };
