import { SWEEP_ROUTES } from './SWEEP_ROUTES';

/**
 * The routes a leak sweep visits: every page that needs nothing, then the reader on a book and the
 * player on a film where the server has one, since those two pages hold the largest things the app
 * makes — page images and a video's buffers.
 *
 * @param found - The first book and film the server listed, or null where it has none.
 * @returns The routes, in the order they are swept.
 */
const planSweepRoutes = (found: { book: string | null; film: string | null }): string[] => [
  ...SWEEP_ROUTES,
  ...(found.book === null ? [] : [`/read/${found.book}`]),
  ...(found.film === null ? [] : [`/watch/${found.film}`]),
];

export { planSweepRoutes };
