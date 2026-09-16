import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { LandingShell } from '@ValenceLanding/components/LandingShell/LandingShell';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';

/**
 * Builds the router for getvalence.app: a handful of static pages behind one shell that carries the
 * nav, the footer and the reveal between them.
 *
 * These routes name paths only, not components — `LandingShell` looks its own page up by pathname
 * and renders it directly, rather than through the `Outlet` these routes would otherwise feed. See
 * `LandingShell` for why.
 */
const buildRouter = () => {
  const root = createRootRoute({ component: LandingShell });

  const home = createRoute({ getParentRoute: () => root, path: '/' });

  const changelog = createRoute({ getParentRoute: () => root, path: '/changelog' });

  const privacy = createRoute({ getParentRoute: () => root, path: '/privacy' });

  const terms = createRoute({ getParentRoute: () => root, path: '/terms' });

  return createRouter({
    routeTree: root.addChildren([home, changelog, privacy, terms]),
    defaultErrorComponent: PageProblem,
    scrollRestoration: true,
  });
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof buildRouter>;
  }
}

export { buildRouter };
