import { buildRouter } from '@ValenceScreens/routes/buildRouter';

/**
 * Loads the code behind every page of the application, before any test waits for a page to draw.
 *
 * Each page is its own chunk, fetched the first time somebody goes there. In a test that means the
 * first visit to a page reads and compiles everything beneath it inside the `findBy` waiting for
 * it, and on a busy machine that alone can outlast the wait. Loaded once up front, a test waits only
 * for what it is testing.
 *
 * @returns Once every page is loaded.
 */
const loadEveryPage = async (): Promise<void> => {
  const router = buildRouter();

  await Promise.all(
    Object.values(router.routesById).map(
      async (route) => router.loadRouteChunk(route) ?? Promise.resolve(),
    ),
  );
};

export { loadEveryPage };
