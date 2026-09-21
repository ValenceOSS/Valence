import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { ApiReferencePage } from '@ValenceDocs/components/ApiReferencePage/ApiReferencePage';
import { DocPageRoute } from '@ValenceDocs/components/DocPageRoute/DocPageRoute';
import { DocsHome } from '@ValenceDocs/components/DocsHome/DocsHome';
import { DocsNotFound } from '@ValenceDocs/components/DocsNotFound/DocsNotFound';
import { DocsShell } from '@ValenceDocs/components/DocsShell/DocsShell';

/**
 * Builds the router for the documentation: the front page, the API reference and one address for
 * every page under the content folder, all inside one shell.
 *
 * Pages are answered by one route that looks the address up rather than one route each, so adding a
 * page is adding a file and nothing here changes.
 */
const buildRouter = () => {
  const root = createRootRoute({ component: DocsShell, notFoundComponent: DocsNotFound });

  const home = createRoute({ getParentRoute: () => root, path: '/', component: DocsHome });

  const api = createRoute({
    getParentRoute: () => root,
    path: '/api',
    component: ApiReferencePage,
  });

  const page = createRoute({ getParentRoute: () => root, path: '$', component: DocPageRoute });

  return createRouter({
    routeTree: root.addChildren([home, api, page]),
    defaultNotFoundComponent: DocsNotFound,
    scrollRestoration: true,
  });
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof buildRouter>;
  }
}

export { buildRouter };
