import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import type { RouterHistory } from '@tanstack/react-router';
import { LandingShell } from '@ValenceLanding/components/LandingShell/LandingShell';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import { preloadPage } from '@ValenceLanding/components/LandingShell/preloadPage';

/**
 * Builds the router for getvalence.app: a handful of static pages behind one shell that carries the
 * nav, the footer and the reveal between them.
 *
 * These routes name paths only, not components — `LandingShell` looks its own page up by pathname
 * and renders it directly, rather than through the `Outlet` these routes would otherwise feed. See
 * `LandingShell` for why. Each route's loader fetches its page's code, so a link pressed, or only
 * pointed at, brings the page's code before the page is drawn.
 *
 * @param history - Where addresses come from, the browser's own unless a test says otherwise.
 */
const buildRouter = (history?: RouterHistory) => {
  const root = createRootRoute({ component: LandingShell });

  const loader = ({ location }: { location: { pathname: string } }) =>
    preloadPage(location.pathname);

  const home = createRoute({ getParentRoute: () => root, path: '/', loader });

  const changelog = createRoute({ getParentRoute: () => root, path: '/changelog', loader });

  const release = createRoute({ getParentRoute: () => root, path: '/changelog/$slug', loader });

  const about = createRoute({ getParentRoute: () => root, path: '/about', loader });

  const architecture = createRoute({ getParentRoute: () => root, path: '/architecture', loader });

  const compare = createRoute({ getParentRoute: () => root, path: '/compare', loader });

  const features = createRoute({ getParentRoute: () => root, path: '/features', loader });

  const downloads = createRoute({ getParentRoute: () => root, path: '/downloads', loader });

  const developers = createRoute({ getParentRoute: () => root, path: '/developers', loader });

  const requirements = createRoute({ getParentRoute: () => root, path: '/requirements', loader });

  const transcoding = createRoute({ getParentRoute: () => root, path: '/transcoding', loader });

  const tour = createRoute({ getParentRoute: () => root, path: '/tour', loader });

  const principles = createRoute({ getParentRoute: () => root, path: '/principles', loader });

  const roadmap = createRoute({
    getParentRoute: () => root,
    path: '/roadmap',
    beforeLoad: () => {
      // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router moves on by throwing its redirect.
      throw redirect({ to: '/principles', replace: true });
    },
  });

  const plugins = createRoute({ getParentRoute: () => root, path: '/plugins', loader });

  const privacy = createRoute({ getParentRoute: () => root, path: '/privacy', loader });

  const terms = createRoute({ getParentRoute: () => root, path: '/terms', loader });

  const ui = createRoute({ getParentRoute: () => root, path: '/ui', loader });

  const uiComponent = createRoute({ getParentRoute: () => root, path: '/ui/$component', loader });

  return createRouter({
    routeTree: root.addChildren([
      home,
      changelog,
      release,
      about,
      architecture,
      compare,
      features,
      downloads,
      developers,
      requirements,
      transcoding,
      tour,
      principles,
      roadmap,
      plugins,
      privacy,
      terms,
      ui,
      uiComponent,
    ]),
    defaultErrorComponent: PageProblem,
    defaultPreload: 'intent',
    ...(history === undefined ? {} : { history }),
    scrollRestoration: true,
  });
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof buildRouter>;
  }
}

export { buildRouter };
