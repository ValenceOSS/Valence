import { saying } from '@ValenceI18n/saying';
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
import type {
  RequestsSolver,
  RequestsStatus,
  RequestsVpn,
} from '@ValenceContracts/schemas/Requests';
import type { IndexerService } from '@ValenceRequests/indexers/createIndexerService';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';
import { say } from '@ValenceI18n/say';

type CreateAppOptions = {
  secret: string;
  version: string;
  readVpn: () => RequestsVpn;
  readSolver: () => RequestsSolver;
  isDatabaseUp: () => Promise<boolean>;
  indexers: IndexerService;
  definitions: Pick<DefinitionCatalogue, 'catalogue' | 'detail' | 'refresh'>;
  routes?: readonly Hono[];
  profiles?: Pick<ProfileService, 'find'>;
};

const NO_SUCH_INDEXER = refuse('error.indexers.noSuchIndexer');

/**
 * Builds the service's HTTP surface: an open health check for the container runtime, and
 * everything else behind the secret it shares with the Valence server.
 *
 * @param secret - What the server presents as a bearer token.
 * @param version - The release this service is.
 * @param readVpn - The last word on the VPN.
 * @param readSolver - The last word on the browser that gets past Cloudflare's check.
 * @param isDatabaseUp - Whether the database answers.
 * @param indexers - The indexers, and searching them.
 * @param definitions - The catalogue of sites a definition describes.
 * @param routes - Everything else the service offers, mounted under `/api`.
 * @param profiles - The quality profiles a search can be judged against.
 * @returns The app.
 */
const createApp = ({
  secret,
  version,
  readVpn,
  readSolver,
  isDatabaseUp,
  indexers,
  definitions,
  routes = [],
  profiles = { find: () => Promise.resolve(null) },
}: CreateAppOptions) => {
  const app = new Hono();

  app.get('/health', async (context) =>
    (await isDatabaseUp())
      ? context.json({ ok: true })
      : context.json({ ok: false, problem: saying('requests.app.theDatabaseIsNotAnswering') }, 503),
  );

  app.use('/api/*', bearerAuth({ token: secret }));

  for (const mounted of routes) {
    app.route('/api', mounted);
  }

  app.get('/api/status', async (context) =>
    context.json({
      version,
      vpn: readVpn(),
      indexers: await indexers.health(),
      solver: readSolver(),
    } satisfies RequestsStatus),
  );

  app.get('/api/indexers', async (context) => context.json(await indexers.list()));

  app.post('/api/indexers', async (context) => {
    const draft = await readBody(context.req.raw, IndexerDraftSchema);

    if (draft === null) {
      return context.json(refuse('error.indexers.thatIsNotAnIndexer'), 400);
    }

    const added = await indexers.add(draft);

    return 'refused' in added
      ? context.json(refuseWith(added.refused), 400)
      : context.json(added, 201);
  });

  app.post('/api/indexers/try', async (context) => {
    const draft = await readBody(context.req.raw, IndexerDraftSchema);

    return draft === null
      ? context.json(refuse('error.indexers.thatIsNotAnIndexer'), 400)
      : context.json(await indexers.tryDraft(draft));
  });

  app.patch('/api/indexers/:id', async (context) => {
    const change = await readBody(context.req.raw, IndexerChangeSchema);

    if (change === null) {
      return context.json(refuse('error.indexers.thatIsNotAChangeTo'), 400);
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
      ? context.json(refuse('error.indexers.thatIsNotAnIndexer'), 400)
      : context.json(await indexers.tryDraft(draft, context.req.param('id')));
  });

  app.post('/api/indexers/:id/download', async (context) => {
    const asked = await readBody(context.req.raw, ReleaseDownloadRequestSchema);

    if (asked === null) {
      return context.json(refuse('error.common.sayWhichReleaseToFetch'), 400);
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
            error instanceof IndexerFailure
              ? error.message
              : say('requests.app.theReleaseCouldNotBeFetched'),
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
      ? context.json(refuse('error.indexers.noSuchDefinition'), 404)
      : context.json(detail);
  });

  app.post('/api/search', async (context) => {
    const search = await readBody(context.req.raw, ReleaseSearchSchema);

    if (search === null) {
      return context.json(refuse('error.indexers.thatIsNotASearch'), 400);
    }

    const profile = search.profileId === undefined ? null : await profiles.find(search.profileId);

    if (search.profileId !== undefined && profile === null) {
      return context.json(refuse('error.common.noSuchProfile'), 400);
    }

    return context.json(await indexers.search(search, profile));
  });

  return app;
};

export type { CreateAppOptions };

export { createApp };
