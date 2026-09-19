import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import {
  IndexerChangeSchema,
  IndexerDraftSchema,
  ReleaseDownloadRequestSchema,
  ReleaseSearchSchema,
} from '@ValenceContracts/schemas/Indexer';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { DefinitionCatalogue } from '@ValenceRequests/definitions/createDefinitionCatalogue';
import { readBody } from '@ValenceRequests/readBody';
import type { RequestsStatus, RequestsVpn } from '@ValenceContracts/schemas/Requests';
import type { IndexerService } from '@ValenceRequests/indexers/createIndexerService';

type CreateAppOptions = {
  secret: string;
  version: string;
  readVpn: () => RequestsVpn;
  isDatabaseUp: () => Promise<boolean>;
  indexers: IndexerService;
  definitions: Pick<DefinitionCatalogue, 'catalogue' | 'detail' | 'refresh'>;
  downloads?: Hono;
};

const NO_SUCH_INDEXER = { error: 'No such indexer.' };

/**
 * Builds the service's HTTP surface: an open health check for the container runtime, and
 * everything else behind the secret it shares with the Valence server.
 *
 * @param secret - What the server presents as a bearer token.
 * @param version - The release this service is.
 * @param readVpn - The last word on the VPN.
 * @param isDatabaseUp - Whether the database answers.
 * @param indexers - The indexers, and searching them.
 * @param definitions - The catalogue of sites a definition describes.
 * @param downloads - The download clients and the queue, mounted under `/api`.
 * @returns The app.
 */
const createApp = ({
  secret,
  version,
  readVpn,
  isDatabaseUp,
  indexers,
  definitions,
  downloads = new Hono(),
}: CreateAppOptions) => {
  const app = new Hono();

  app.get('/health', async (context) =>
    (await isDatabaseUp())
      ? context.json({ ok: true })
      : context.json({ ok: false, problem: 'The database is not answering' }, 503),
  );

  app.use('/api/*', bearerAuth({ token: secret }));

  app.route('/api', downloads);

  app.get('/api/status', async (context) =>
    context.json({
      version,
      vpn: readVpn(),
      indexers: await indexers.health(),
    } satisfies RequestsStatus),
  );

  app.get('/api/indexers', async (context) => context.json(await indexers.list()));

  app.post('/api/indexers', async (context) => {
    const draft = await readBody(context.req.raw, IndexerDraftSchema);

    if (draft === null) {
      return context.json({ error: 'That is not an indexer.' }, 400);
    }

    const added = await indexers.add(draft);

    return typeof added === 'string'
      ? context.json({ error: added }, 400)
      : context.json(added, 201);
  });

  app.post('/api/indexers/try', async (context) => {
    const draft = await readBody(context.req.raw, IndexerDraftSchema);

    return draft === null
      ? context.json({ error: 'That is not an indexer.' }, 400)
      : context.json(await indexers.tryDraft(draft));
  });

  app.patch('/api/indexers/:id', async (context) => {
    const change = await readBody(context.req.raw, IndexerChangeSchema);

    if (change === null) {
      return context.json({ error: 'That is not a change to an indexer.' }, 400);
    }

    const changed = await indexers.change(context.req.param('id'), change);

    return changed === null ? context.json(NO_SUCH_INDEXER, 404) : context.json(changed);
  });

  app.delete('/api/indexers/:id', async (context) =>
    (await indexers.remove(context.req.param('id')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_INDEXER, 404),
  );

  app.post('/api/indexers/:id/test', async (context) => {
    const tested = await indexers.test(context.req.param('id'));

    return tested === null ? context.json(NO_SUCH_INDEXER, 404) : context.json(tested);
  });

  app.post('/api/indexers/:id/try', async (context) => {
    const draft = await readBody(context.req.raw, IndexerDraftSchema);

    return draft === null
      ? context.json({ error: 'That is not an indexer.' }, 400)
      : context.json(await indexers.tryDraft(draft, context.req.param('id')));
  });

  app.post('/api/indexers/:id/download', async (context) => {
    const asked = await readBody(context.req.raw, ReleaseDownloadRequestSchema);

    if (asked === null) {
      return context.json({ error: 'Say which release to fetch.' }, 400);
    }

    try {
      const file = await indexers.download(context.req.param('id'), asked.url);

      if (file === null) {
        return context.json(NO_SUCH_INDEXER, 404);
      }

      return file.kind === 'magnet'
        ? context.json({ magnet: file.url })
        : context.body(file.bytes.slice(), 200, {
            'content-type': file.kind === 'nzb' ? 'application/x-nzb' : 'application/x-bittorrent',
          });
    } catch (error) {
      return context.json(
        {
          error:
            error instanceof IndexerFailure ? error.message : 'The release could not be fetched.',
        },
        502,
      );
    }
  });

  app.get('/api/definitions', async (context) => context.json(await definitions.catalogue()));

  app.post('/api/definitions/refresh', async (context) =>
    context.json(await definitions.refresh()),
  );

  app.get('/api/definitions/:id', async (context) => {
    const detail = await definitions.detail(context.req.param('id'));

    return detail === null
      ? context.json({ error: 'No such definition.' }, 404)
      : context.json(detail);
  });

  app.post('/api/search', async (context) => {
    const search = await readBody(context.req.raw, ReleaseSearchSchema);

    return search === null
      ? context.json({ error: 'That is not a search.' }, 400)
      : context.json(await indexers.search(search));
  });

  return app;
};

export type { CreateAppOptions };

export { createApp };
