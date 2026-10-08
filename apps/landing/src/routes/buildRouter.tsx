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

  const release = createRoute({ getParentRoute: () => root, path: '/changelog/$slug' });

  const about = createRoute({ getParentRoute: () => root, path: '/about' });

  const architecture = createRoute({ getParentRoute: () => root, path: '/architecture' });

  const compare = createRoute({ getParentRoute: () => root, path: '/compare' });

  const developers = createRoute({ getParentRoute: () => root, path: '/developers' });

  const requirements = createRoute({ getParentRoute: () => root, path: '/requirements' });

  const transcoding = createRoute({ getParentRoute: () => root, path: '/transcoding' });

  const tour = createRoute({ getParentRoute: () => root, path: '/tour' });

  const roadmap = createRoute({ getParentRoute: () => root, path: '/roadmap' });

  const plugins = createRoute({ getParentRoute: () => root, path: '/plugins' });

  const privacy = createRoute({ getParentRoute: () => root, path: '/privacy' });

  const terms = createRoute({ getParentRoute: () => root, path: '/terms' });

  const ui = createRoute({ getParentRoute: () => root, path: '/ui' });

  const uiComponent = createRoute({ getParentRoute: () => root, path: '/ui/$component' });

  return createRouter({
    routeTree: root.addChildren([
      home,
      changelog,
      release,
      about,
      architecture,
      compare,
      developers,
      requirements,
      transcoding,
      tour,
      roadmap,
      plugins,
      privacy,
      terms,
      ui,
      uiComponent,
    ]),
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
