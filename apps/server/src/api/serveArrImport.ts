import { bodyOf } from '@ValenceI18n/bodyOf';
import { refuse } from '@ValenceI18n/refuse';
import { saidFrom } from '@ValenceI18n/saidFrom';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type {
  ArrImportAsk,
  ArrImportOrder,
  ArrWanted,
  ArrWantedOutcome,
} from '@ValenceContracts/schemas/ArrImport';
import type { MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import { accountOfRequester } from '@ValenceServer/arrImport/accountOfRequester';
import {
  applyArrImportRoute,
  askArrWantedRoute,
  planArrImportRoute,
} from '@ValenceServer/routes/ArrImportRoute';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';

const IMPORTED_GRANTS: readonly Permission[] = [
  'requests.ask',
  'requests.askMusic',
  'requests.autoApprove',
];

/**
 * Registers bringing a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup into
 * requesting: planning it and doing it through the requests service, with the server's libraries
 * for it to match root folders against, then setting how each library is fulfilled; and asking for
 * what that setup was waiting for, a few at a time so the admin sees it go, each as whoever asked
 * for it there where Valence knows them and as the admin otherwise.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 * @param options - What the server was built with: finding a series by its TVDB id, and the
 * accounts an import from Jellyfin, Emby or Plex made.
 */
const serveArrImport = (
  app: OpenAPIHono,
  context: AppContext,
  options: Pick<CreateAppOptions, 'seriesOfTvdbId' | 'importedAccounts'>,
): void => {
  const { auth, library, throughRequests, draftFor, sayOfAsk, listUsers, requires } = context;
  const { seriesOfTvdbId = () => Promise.resolve(null), importedAccounts } = options;

  const orderOf = async (ask: ArrImportAsk): Promise<ArrImportOrder> => ({
    sources: ask.sources,
    pathMappings: ask.pathMappings ?? [],
    secrets: ask.secrets ?? {},
    choices: ask.choices ?? {},
    libraries: (await library.list(asTheServer))
      .filter((entry) => entry.kind !== 'books')
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        kind: entry.kind,
        path: entry.path,
        requestPath: entry.requestPath,
      })),
  });

  app.openapi(planArrImportRoute, async (context) => {
    const order = await orderOf(context.req.valid('json'));
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.planArrImport(order),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json(bodyOf(answer), answer.status);
  });

  app.openapi(applyArrImportRoute, async (context) => {
    const order = await orderOf(context.req.valid('json'));
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.applyArrImport(order),
    );

    if (answer.kind !== 'answered') {
      return context.json(bodyOf(answer), answer.status);
    }

    const libraries = await library.list(asTheServer);
    const problems: Said[] = [...answer.value.problems];

    for (const setting of answer.value.libraries) {
      const entry = libraries.find((one) => one.id === setting.libraryId);

      if (entry === undefined) {
        continue;
      }

      const updated = await library.update(entry.id, {
        defaultAudioLanguage: entry.defaultAudioLanguage,
        fulfilment: setting.fulfilment,
        ...(setting.choice === 'takeOver' && setting.profileId !== null
          ? { requestProfileId: setting.profileId }
          : {}),
      });

      if (updated === null) {
        problems.push(saying('server.arrImport.libraryCouldNotBeChanged', { library: entry.name }));
      }
    }

    return context.json({ ...answer.value, problems }, 200);
  });

  app.openapi(askArrWantedRoute, async (context) => {
    const headers = context.req.raw.headers;

    if (!(await requires(headers, 'requests.manage'))) {
      return context.json(refuse('error.common.thatIsForWhoeverSetsUp'), 403);
    }

    const admin = (await readSessionOnce(auth, headers))?.user ?? null;

    if (admin === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 403);
    }

    const accounts = (await listUsers?.()) ?? [];
    const imported = (await importedAccounts?.()) ?? [];
    const outcome: ArrWantedOutcome = { made: 0, already: 0, failed: [] };

    const fail = (item: ArrWanted, problem: Said) => {
      outcome.failed.push({ key: item.key, title: item.title, problem });
    };

    for (const item of context.req.valid('json').items) {
      const account =
        item.requester === null
          ? { id: admin.id, name: admin.name }
          : (accountOfRequester(item.requester, imported, accounts) ?? {
              id: admin.id,
              name: admin.name,
            });
      const asker = {
        account: () => Promise.resolve(account),
        holds: (permission: Permission) => Promise.resolve(IMPORTED_GRANTS.includes(permission)),
      };
      const tmdbId =
        item.tmdbId ??
        (item.kind === 'series' && item.tvdbId !== null ? await seriesOfTvdbId(item.tvdbId) : null);

      if (item.kind !== 'artist' && tmdbId === null) {
        fail(item, saying('server.arrEmulation.theCatalogueKnowsNoSeriesByThat'));
        continue;
      }

      const wanted: MediaRequestAsk = {
        kind: item.kind,
        ...(tmdbId === null ? {} : { tmdbId }),
        ...(item.musicBrainzId === null ? {} : { musicBrainzId: item.musicBrainzId }),
        seasons: item.kind === 'series' ? item.seasons : null,
        ...(item.libraryId === null ? {} : { libraryId: item.libraryId }),
      };
      const drafted = await draftFor(asker, wanted, item.profileId ?? undefined);

      if (drafted.kind === 'refused') {
        fail(item, saidFrom(bodyOf(drafted)));
        continue;
      }

      const answer = await throughRequests(
        asker,
        (client) => client.addRequest({ ...drafted.draft, isApproved: item.isApproved }),
        ['requests.ask', 'requests.askMusic'],
      );

      if (answer.kind !== 'answered') {
        fail(item, saidFrom(bodyOf(answer)));
        continue;
      }

      sayOfAsk(answer.value.request, answer.value.isNew, item.isApproved);

      if (answer.value.isNew) {
        outcome.made += 1;
      } else {
        outcome.already += 1;
      }
    }

    return context.json(outcome, 200);
  });
};

export { serveArrImport };
