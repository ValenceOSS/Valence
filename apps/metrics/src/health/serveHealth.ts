import { sql } from 'drizzle-orm';
import { openDatabase } from '@ValenceMetrics/db/openDatabase';

/**
 * Says whether the site is up and can reach its database, for whatever watches over it.
 *
 * @returns 200 when it can, 503 when it cannot.
 */
const serveHealth = async (): Promise<Response> => {
  const isReachable = await Promise.resolve()
    .then(() => openDatabase().execute(sql`select 1`))
    .then(() => true)
    .catch(() => false);

  return Response.json(
    { status: isReachable ? 'ok' : 'unavailable' },
    { status: isReachable ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
};

export { serveHealth };
