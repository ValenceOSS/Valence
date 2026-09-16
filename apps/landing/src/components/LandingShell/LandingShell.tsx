import { useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { FoldGradient } from '@ValenceLanding/components/FoldGradient/FoldGradient';
import { LandingNav } from '@ValenceLanding/components/LandingNav/LandingNav';
import { LandingFooter } from '@ValenceLanding/components/LandingFooter/LandingFooter';
import { HomePage } from '@ValenceLanding/components/HomePage/HomePage';
import { ChangelogPage } from '@ValenceLanding/components/ChangelogPage/ChangelogPage';
import { PrivacyPage } from '@ValenceLanding/components/PrivacyPage/PrivacyPage';
import { TermsPage } from '@ValenceLanding/components/TermsPage/TermsPage';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import type { ComponentType } from 'react';

const PAGES: Record<string, ComponentType> = {
  '/': HomePage,
  '/changelog': ChangelogPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
};

/**
 * What every page on getvalence.app sits inside: the nav, the footer, the hero's own shader — held
 * here rather than inside the hero itself, so leaving and returning to the home page never rebuilds
 * its WebGL context — and a reveal between one page and the next.
 *
 * The page shown is looked up here and rendered directly rather than through `Outlet`. `Outlet`
 * stays subscribed to the router's current match even while `AnimatePresence` is still playing its
 * exit — so the page fading out would silently swap to the page fading in partway through, rather
 * than finishing its own exit undisturbed. A plain looked-up component has no such subscription: once
 * `AnimatePresence` stops asking this component to re-render it, it just sits still until removed.
 */
const LandingShell = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const prefersReducedMotion = useReducedMotionConfig();
  const isHome = pathname === '/';
  const Page = PAGES[pathname] ?? PageProblem;

  return (
    <div className="relative z-0 flex min-h-dvh flex-col bg-surface text-text">
      <div
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 -z-10 h-svh overflow-hidden transition-opacity duration-500',
          isHome ? 'opacity-100' : 'opacity-0',
        )}
      >
        <FoldGradient
          className="h-full w-full opacity-60"
          speed={isHome && prefersReducedMotion !== true ? 1 : 0}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-surface" />
      </div>

      <LandingNav />

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          variants={revealVariants(prefersReducedMotion)}
          initial="hidden"
          animate="shown"
          exit="gone"
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className="flex-1"
        >
          <Page />
        </motion.main>
      </AnimatePresence>

      <LandingFooter />
    </div>
  );
};

LandingShell.displayName = 'LandingShell';

export { LandingShell };
