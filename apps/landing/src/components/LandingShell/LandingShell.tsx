import { useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { ReleaseBar } from '@ValenceLanding/components/ReleaseBar/ReleaseBar';
import { LandingNav } from '@ValenceLanding/components/LandingNav/LandingNav';
import { LandingFooter } from '@ValenceLanding/components/LandingFooter/LandingFooter';
import { HomePage } from '@ValenceLanding/components/HomePage/HomePage';
import { ChangelogPage } from '@ValenceLanding/components/ChangelogPage/ChangelogPage';
import { PluginsPage } from '@ValenceLanding/components/PluginsPage/PluginsPage';
import { ChangelogEntryPage } from '@ValenceLanding/components/ChangelogEntryPage/ChangelogEntryPage';
import { PrivacyPage } from '@ValenceLanding/components/PrivacyPage/PrivacyPage';
import { TermsPage } from '@ValenceLanding/components/TermsPage/TermsPage';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import { UiLibraryPage } from '@ValenceLanding/components/UiLibraryPage/UiLibraryPage';
import type { ComponentType } from 'react';

const PAGES: Record<string, ComponentType> = {
  '/': HomePage,
  '/changelog': ChangelogPage,
  '/plugins': PluginsPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
  '/ui': UiLibraryPage,
};

/**
 * What every page on getvalence.app sits inside: the line about the newest release, the nav, the
 * footer, and a reveal between one page and the next.
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
  const isUiLibrary = pathname.startsWith('/ui/');
  const Page =
    PAGES[pathname] ??
    (pathname.startsWith('/changelog/')
      ? ChangelogEntryPage
      : isUiLibrary
        ? UiLibraryPage
        : PageProblem);

  return (
    <div className="relative z-0 flex min-h-dvh flex-col bg-[var(--frame-back)] text-text">
      <ReleaseBar />

      <LandingNav />

      <AnimatePresence mode="wait">
        <motion.main
          key={isUiLibrary ? '/ui' : pathname}
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
