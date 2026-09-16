import { render } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRoute,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import type { RenderResult } from '@testing-library/react';
import type { RouteComponent } from '@tanstack/react-router';

/**
 * Renders a component as the root of a router carrying every real page, so a `Link` inside it can
 * resolve every address the site actually has rather than the one route a narrower test would
 * bother to register.
 *
 * @param component - What to render at the root.
 * @param path - Which address the router starts at.
 * @returns Whatever `render` returns, once the router has settled its first match — a router that
 *   hasn't finished matching yet renders nothing at all, not even the root's own component.
 */
const renderWithRoutes = async (component: RouteComponent, path = '/'): Promise<RenderResult> => {
  const root = createRootRoute({ component });
  const home = createRoute({ getParentRoute: () => root, path: '/' });
  const changelog = createRoute({ getParentRoute: () => root, path: '/changelog' });
  const privacy = createRoute({ getParentRoute: () => root, path: '/privacy' });
  const terms = createRoute({ getParentRoute: () => root, path: '/terms' });

  const router = createRouter({
    routeTree: root.addChildren([home, changelog, privacy, terms]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();

  return render(<RouterProvider router={router} />);
};

export { renderWithRoutes };
