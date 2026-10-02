import { Hono } from 'hono';
import { ArrImportOrderSchema } from '@ValenceContracts/schemas/ArrImport';
import { refuse } from '@ValenceI18n/refuse';
import { readBody } from '@ValenceRequests/readBody';
import type { ArrImportService } from '@ValenceRequests/arrImport/createArrImportService';

type CreateArrImportRoutesOptions = { imports: Pick<ArrImportService, 'plan' | 'apply'> };

const NOT_AN_ORDER = refuse('error.arrImport.thatIsNotASetupToBringIn');

/**
 * Bringing a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup in, as routes under
 * `/api`: planning it, which changes nothing anywhere, and doing it, which changes only Valence.
 *
 * @param imports - The import.
 * @returns The routes.
 */
const createArrImportRoutes = ({ imports }: CreateArrImportRoutesOptions) => {
  const routes = new Hono();

  routes.post('/imports/arr/plan', async (context) => {
    const order = await readBody(context.req.raw, ArrImportOrderSchema);

    return order === null
      ? context.json(NOT_AN_ORDER, 400)
      : context.json(await imports.plan(order));
  });

  routes.post('/imports/arr/apply', async (context) => {
    const order = await readBody(context.req.raw, ArrImportOrderSchema);

    return order === null
      ? context.json(NOT_AN_ORDER, 400)
      : context.json(await imports.apply(order));
  });

  return routes;
};

export { createArrImportRoutes };
