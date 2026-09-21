import { render } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import type { RenderResult } from '@testing-library/react';
import type { RouteComponent } from '@tanstack/react-router';

/**
 * Renders a component at the root of a router that answers every address, so a `Link` inside it
 * resolves whatever page it points at.
 *
 * @param component - What to render at the root.
 * @param path - Where the router starts.
 * @returns Whatever `render` returns, once the router has matched its first route.
 */
const renderInDocsRouter = async (component: RouteComponent, path = '/'): Promise<RenderResult> => {
  const root = createRootRoute({ component });
  const anywhere = createRoute({ getParentRoute: () => root, path: '$' });
  const home = createRoute({ getParentRoute: () => root, path: '/' });

  const router = createRouter({
    routeTree: root.addChildren([home, anywhere]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();

  return render(<RouterProvider router={router} />);
};

export { renderInDocsRouter };
