import { say } from '@ValenceI18n/say';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  approveMediaRequestRoute,
  askForMediaRoute,
  changeMediaRequestRoute,
  listMediaRequestsRoute,
  mediaRequestLogRoute,
  mediaRequestReleasesRoute,
  pickMediaReleaseRoute,
  refuseMediaRequestRoute,
  removeMediaRequestRoute,
  retryMediaRequestRoute,
  fulfilMediaRequestRoute,
  draftReleasesRoute,
  searchMissingRoute,
  seriesSeasonsRoute,
  musicCatalogueRoute,
  discoverRoute,
  catalogueBrowseRoute,
  catalogueGenresRoute,
  decideMediaRequestsRoute,
  liftMediaBlockRoute,
  mediaRequestBlocklistRoute,
  catalogueSearchRoute,
  catalogueTitleRoute,
  requestProgressRoute,
  addQualityProfileRoute,
  changeQualityProfileRoute,
  listQualityProfilesRoute,
  profilesOnOfferRoute,
  removeQualityProfileRoute,
  addDownloadClientRoute,
  changeDownloadClientRoute,
  listDownloadClientsRoute,
  fileQueuedDownloadRoute,
  pauseQueuedDownloadRoute,
  readDownloadQueueRoute,
  removeDownloadClientRoute,
  removeQueuedDownloadRoute,
  resumeQueuedDownloadRoute,
  sendReleaseRoute,
  testDownloadClientRoute,
  tryDownloadClientChangeRoute,
  tryDownloadClientRoute,
  addIndexerRoute,
  adminCheckRequestsRoute,
  adminRequestsOverviewRoute,
  changeIndexerRoute,
  listDefinitionsRoute,
  listIndexersRoute,
  readDefinitionRoute,
  refreshDefinitionsRoute,
  removeIndexerRoute,
  requestsAvailabilityRoute,
  searchReleasesRoute,
  testIndexerRoute,
  tryIndexerChangeRoute,
  tryIndexerRoute,
} from '@ValenceServer/routes/RequestsRoute';
import { ReleaseDownloadRequestSchema } from '@ValenceContracts/schemas/Indexer';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { seasonsOf } from '@ValenceContracts/functions/seasonsOf';
import { describeCatalogueTitle } from '@ValenceServer/requests/catalogue/describeCatalogueTitle';
import { bookAsTitle, discoverShelves } from '@ValenceServer/requests/catalogue/discoverShelves';
import { standTitles } from '@ValenceServer/requests/catalogue/standTitles';
import { progressOf } from '@ValenceServer/requests/progressOf';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the requests endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveRequests = (app: OpenAPIHono, context: AppContext): void => {
  const {
    auth,
    library,
    requests,
    requestsClient,
    searchCatalogue,
    describeForRequest,
    searchMusicCatalogue,
    discovery,
    NOT_STOOD,
    requires,
    requestsOverview,
    notYours,
    recheckRequests,
    requestingOff,
    reachRequests,
    throughRequests,
    APPROVERS,
    ASKERS,
    SEES_EVERY_REQUEST,
    profilesFor,
    sayRequestsChanged,
    sayOfRequest,
    profileForAsk,
    catalogueFor,
    draftFor,
    whatMayBeAsked,
    everyRequest,
  } = context;

  app.openapi(requestsAvailabilityRoute, async (context) => {
    if ((await readSessionOnce(auth, context.req.raw.headers)) === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ isEnabled: requests !== null }, 200);
  });

  app.openapi(adminRequestsOverviewRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'requests.manage'))) {
      return context.json({ error: say('server.errors.forWhoeverSetsUpRequesting') }, 403);
    }

    const overview = await requestsOverview();

    return overview === null
      ? context.json({ error: say('server.errors.requestingOff') }, 404)
      : context.json(overview, 200);
  });

  app.openapi(adminCheckRequestsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'requests.manage'))) {
      return context.json({ error: say('server.errors.forWhoeverSetsUpRequesting') }, 403);
    }

    if (requests === null) {
      return context.json({ error: say('server.errors.requestingOff') }, 404);
    }

    await requests.check();

    const overview = await requestsOverview();

    return overview === null
      ? context.json({ error: say('server.errors.requestingOff') }, 404)
      : context.json(overview, 200);
  });

  app.openapi(listMediaRequestsRoute, async (context) => {
    const { headers } = context.req.raw;
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(headers, (client) => client.listRequests(), [
      ...ASKERS,
      ...SEES_EVERY_REQUEST,
    ]);

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    const seesAll = (
      await Promise.all(SEES_EVERY_REQUEST.map((permission) => requires(headers, permission)))
    ).some(Boolean);

    return context.json(
      seesAll
        ? answer.value
        : answer.value.filter((request) => request.requestedBy.id === session?.user.id),
      200,
    );
  });

  app.openapi(askForMediaRoute, async (context) => {
    const { headers } = context.req.raw;
    const asked = context.req.valid('json');
    const isByHand = asked.isPickedByHand || asked.release !== undefined;

    if (isByHand && !(await requires(headers, 'requests.manage'))) {
      return context.json({ error: say('server.errors.pickingReleaseForManagers') }, 403);
    }

    const profile = await profileForAsk(headers, asked);

    if (profile.kind === 'refused') {
      return context.json({ error: profile.error }, profile.status);
    }

    const drafted = await draftFor(headers, asked, profile.profileId);
    const answer = await throughRequests(
      headers,
      (client) =>
        drafted.kind === 'refused' ? Promise.resolve(drafted) : client.addRequest(drafted.draft),
      [isMusicRequest(asked.kind) ? 'requests.askMusic' : 'requests.ask'],
    );

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    const { request, isNew } = answer.value;
    const isApproved = drafted.kind === 'drafted' && drafted.draft.isApproved;

    if (isNew) {
      sayOfRequest({
        event: 'requests.made',
        data: { title: request.title, kind: request.kind, requestedBy: request.requestedBy.name },
      });
    }

    if (isApproved && (isNew || request.approval === 'approved')) {
      sayOfRequest({
        event: 'requests.approved',
        data: { title: request.title, approvedBy: null },
      });
    }

    if (asked.release === undefined || requestsClient === null) {
      return context.json(request, isNew ? 201 : 200);
    }

    const picked = await requestsClient.pickRelease(request.id, asked.release);

    if (picked.kind !== 'answered') {
      return context.json(
        {
          error: say('server.errors.releaseNotFetched', {
            reason: picked.kind === 'silent' ? picked.reason : picked.error,
          }),
        },
        400,
      );
    }

    return context.json(picked.value, isNew ? 201 : 200);
  });

  app.openapi(draftReleasesRoute, async (context) => {
    const { headers } = context.req.raw;
    const asked = context.req.valid('json');
    const profile = await profileForAsk(headers, asked);

    if (profile.kind === 'refused') {
      return context.json({ error: profile.error }, profile.status);
    }

    const drafted = await draftFor(headers, asked, profile.profileId);
    const answer = await throughRequests(headers, (client) =>
      drafted.kind === 'refused'
        ? Promise.resolve(drafted)
        : client.releasesForDraft(drafted.draft),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(seriesSeasonsRoute, async (context) => {
    const { headers } = context.req.raw;
    const may = (
      await Promise.all(
        ['requests.ask' as const, ...APPROVERS].map((permission) => requires(headers, permission)),
      )
    ).some(Boolean);

    if (!may) {
      return context.json(notYours(), 403);
    }

    const { tmdbId } = context.req.valid('param');
    const [catalogue, requested, held] = await Promise.all([
      describeForRequest(tmdbId, 'series'),
      everyRequest(),
      discovery.lookup.episodesHeld(tmdbId.toString()),
    ]);

    return catalogue === null
      ? context.json({ error: say('server.errors.catalogueUnknownSeries') }, 404)
      : context.json(
          seasonsOf(
            catalogue.episodes,
            requested.filter((request) => request.kind === 'series' && request.tmdbId === tmdbId),
            held,
          ),
          200,
        );
  });

  app.openapi(musicCatalogueRoute, async (context) => {
    const { headers } = context.req.raw;
    const may = (
      await Promise.all(
        ['requests.askMusic' as const, ...APPROVERS].map((permission) =>
          requires(headers, permission),
        ),
      )
    ).some(Boolean);

    if (!may) {
      return context.json(notYours(), 403);
    }

    const { query, kind } = context.req.valid('query');

    return context.json(await searchMusicCatalogue(query, kind), 200);
  });

  app.openapi(discoverRoute, async (context) => {
    if (requestsClient === null) {
      return context.json(requestingOff(), 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!may.video && !may.music) {
      return context.json(notYours(), 403);
    }

    const [discovered, requested] = await Promise.all([
      discoverShelves(discovery, { ...may, books: may.video }),
      everyRequest(),
    ]);

    return context.json(
      {
        shelves: await Promise.all(
          discovered.shelves.map(async (shelf) => ({
            ...shelf,
            titles: await standTitles(shelf.titles, discovery.lookup, requested),
          })),
        ),
        studios: discovered.studios,
      },
      200,
    );
  });

  app.openapi(catalogueBrowseRoute, async (context) => {
    const { kind, list, studio, page, genre, yearFrom, yearTo, minRating } =
      context.req.valid('query');

    if (requestsClient === null) {
      return context.json(requestingOff(), 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!may.video) {
      return context.json(notYours(), 403);
    }

    const browsed = await discovery.browse({
      list,
      kind: kind === 'film' ? 'movie' : 'tv',
      page,
      studio: studio ?? null,
      filters: {
        ...(genre === undefined ? {} : { genre }),
        ...(yearFrom === undefined ? {} : { yearFrom }),
        ...(yearTo === undefined ? {} : { yearTo }),
        ...(minRating === undefined ? {} : { minRating }),
      },
    });

    const titles = browsed.matches.map((match) => ({
      kind,
      id: match.externalId,
      title: match.title,
      subtitle: null,
      year: match.year,
      overview: match.overview,
      posterUrl: match.posterUrl,
    }));

    return context.json(
      {
        titles: await standTitles(titles, discovery.lookup, await everyRequest()),
        page,
        hasMore: browsed.hasMore,
      },
      200,
    );
  });

  app.openapi(catalogueGenresRoute, async (context) => {
    if (requestsClient === null) {
      return context.json(requestingOff(), 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!may.video) {
      return context.json(notYours(), 403);
    }

    return context.json(
      await discovery.genres(context.req.valid('query').kind === 'film' ? 'movie' : 'tv'),
      200,
    );
  });

  app.openapi(catalogueSearchRoute, async (context) => {
    const { query, kind } = context.req.valid('query');

    if (requestsClient === null) {
      return context.json(requestingOff(), 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!(isMusicRequest(kind) ? may.music : may.video)) {
      return context.json(notYours(), 403);
    }

    const found: UnstoodTitle[] = isBookRequest(kind)
      ? (await discovery.searchBooks(query)).map(bookAsTitle)
      : isMusicRequest(kind)
        ? (await searchMusicCatalogue(query, kind)).map((hit) => ({
            kind: hit.kind,
            id: hit.musicBrainzId,
            title: hit.title,
            subtitle: hit.artist ?? hit.disambiguation,
            year: hit.year,
            overview: null,
            posterUrl: hit.coverUrl,
          }))
        : (await searchCatalogue(query, kind === 'film' ? 'movie' : 'tv')).map((match) => ({
            kind,
            id: match.externalId,
            title: match.title,
            subtitle: null,
            year: match.year,
            overview: match.overview,
            posterUrl: match.posterUrl,
          }));

    return context.json(await standTitles(found, discovery.lookup, await everyRequest()), 200);
  });

  app.openapi(catalogueTitleRoute, async (context) => {
    const { kind, id } = context.req.valid('param');

    if (requestsClient === null) {
      return context.json(requestingOff(), 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!(isMusicRequest(kind) ? may.music : may.video)) {
      return context.json(notYours(), 403);
    }

    const described = await describeCatalogueTitle(discovery, kind, id);

    if (described === null) {
      return context.json({ error: say('server.errors.catalogueUnknown') }, 404);
    }

    const [stood] = await standTitles([described], discovery.lookup, await everyRequest());

    return context.json({ ...described, standing: stood?.standing ?? NOT_STOOD }, 200);
  });

  app.openapi(requestProgressRoute, async (context) => {
    const { headers } = context.req.raw;
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(
      headers,
      async (client) => {
        const listed = await client.listRequests();

        if (listed.kind !== 'answered') {
          return listed;
        }

        const queue = await client.downloads();

        return {
          kind: 'answered' as const,
          value: progressOf(
            listed.value.filter((request) => request.requestedBy.id === session?.user.id),
            queue.kind === 'answered' ? queue.value.downloads : [],
          ),
        };
      },
      [...ASKERS, ...SEES_EVERY_REQUEST],
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(searchMissingRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.searchMissing(),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(changeMediaRequestRoute, async (context) => {
    const { id } = context.req.valid('param');
    const change = context.req.valid('json');
    const answer = await throughRequests(
      context.req.raw.headers,
      async (client) => {
        if (change.seasons === undefined && change.releaseTypes === undefined) {
          return client.changeRequest(id, { change });
        }

        const found = await client.findRequest(id);

        if (found.kind !== 'answered') {
          return found;
        }

        return client.changeRequest(id, { change, catalogue: await catalogueFor(found.value) });
      },
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeMediaRequestRoute, async (context) => {
    const { headers } = context.req.raw;
    const { id } = context.req.valid('param');
    const isDeletingDownloads = context.req.valid('query').deleteDownloads === 'true';
    const isManager = await requires(headers, 'requests.manage');
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(
      headers,
      async (client) => {
        if (isManager) {
          return client.removeRequest(id, isDeletingDownloads);
        }

        const found = await client.findRequest(id);

        if (found.kind !== 'answered') {
          return found;
        }

        if (found.value.requestedBy.id !== session?.user.id) {
          return { kind: 'refused', status: 404, error: say('server.errors.noSuchRequest') };
        }

        return found.value.state === 'filed' || found.value.state === 'available'
          ? {
              kind: 'refused',
              status: 400,
              error: say('server.errors.alreadyInLibrary'),
            }
          : client.removeRequest(id, true);
      },
      ['requests.manage', ...ASKERS],
    );

    if (answer.kind === 'answered') {
      sayRequestsChanged();
    }

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(approveMediaRequestRoute, async (context) => {
    const { headers } = context.req.raw;
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(
      headers,
      (client) => client.approveRequest(context.req.valid('param').id),
      APPROVERS,
    );

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    sayOfRequest({
      event: 'requests.approved',
      data: { title: answer.value.title, approvedBy: session?.user.name ?? null },
    });

    return context.json(answer.value, 200);
  });

  app.openapi(refuseMediaRequestRoute, async (context) => {
    const { reason } = context.req.valid('json');
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.refuseRequest(context.req.valid('param').id, reason),
      APPROVERS,
    );

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    sayOfRequest({
      event: 'requests.refused',
      data: { title: answer.value.title, reason: answer.value.refusedBecause },
    });

    return context.json(answer.value, 200);
  });

  app.openapi(retryMediaRequestRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.retryRequest(context.req.valid('param').id),
    );

    if (answer.kind === 'answered') {
      sayRequestsChanged();
    }

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(fulfilMediaRequestRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.fulfilRequest(context.req.valid('param').id),
    );

    if (answer.kind === 'answered') {
      sayRequestsChanged();
    }

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(mediaRequestLogRoute, async (context) => {
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.requestLog(context.req.valid('param').id),
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(mediaRequestBlocklistRoute, async (context) => {
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.requestBlocklist(context.req.valid('param').id),
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(liftMediaBlockRoute, async (context) => {
    const { id, blockId } = context.req.valid('param');
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.liftBlock(id, blockId),
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(decideMediaRequestsRoute, async (context) => {
    const { headers } = context.req.raw;
    const mayDecide = await Promise.all(
      APPROVERS.map((permission) => requires(headers, permission)),
    );

    if (!mayDecide.includes(true)) {
      return context.json(notYours(), 403);
    }

    if (requestsClient === null) {
      return context.json(requestingOff(), 404);
    }

    const { ids, decision, reason } = context.req.valid('json');
    const decided: MediaRequest[] = [];
    const refused: { id: string; problem: string }[] = [];

    for (const id of ids) {
      const answer = await throughRequests(
        context.req.raw.headers,
        (client) =>
          decision === 'approve' ? client.approveRequest(id) : client.refuseRequest(id, reason),
        APPROVERS,
      );

      if (answer.kind === 'answered') {
        decided.push(answer.value);
      } else {
        refused.push({ id, problem: answer.error });
      }
    }

    if (decided.length === 0 && refused.length > 0) {
      return context.json(
        { error: refused[0]?.problem ?? say('server.errors.nothingDecided') },
        502,
      );
    }

    return context.json({ decided, refused }, 200);
  });

  app.openapi(mediaRequestReleasesRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.requestReleases(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(pickMediaReleaseRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.pickRelease(context.req.valid('param').id, context.req.valid('json').release),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(profilesOnOfferRoute, async (context) => {
    const { kind, libraryId } = context.req.valid('query');
    const answer = await profilesFor(context.req.raw.headers, kind, libraryId);

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(listQualityProfilesRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.listProfiles(),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(addQualityProfileRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.addProfile(context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 201)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(changeQualityProfileRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.changeProfile(context.req.valid('param').id, context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeQualityProfileRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.removeProfile(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(listDownloadClientsRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) => client.listClients());

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(addDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.addClient(context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 201)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(tryDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.tryClient(context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(changeDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.changeClient(context.req.valid('param').id, context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.removeClient(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(testDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.testClient(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(tryDownloadClientChangeRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.tryClient(context.req.valid('json'), context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(readDownloadQueueRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) => client.downloads());

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(sendReleaseRoute, async (context) => {
    const sending = context.req.valid('json');
    const fileable = (await library.list(asTheServer)).filter(
      (entry) => entry.kind === sending.libraryKind,
    );
    const into =
      sending.libraryId === undefined
        ? fileable[0]
        : fileable.find((entry) => entry.id === sending.libraryId);
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.sendRelease({
        ...sending,
        library: into === undefined ? null : { id: into.id, path: into.path },
      }),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 201)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(fileQueuedDownloadRoute, async (context) => {
    const { libraryId } = context.req.valid('json');
    const into = (await library.list(asTheServer)).find((entry) => entry.id === libraryId);
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      into === undefined
        ? Promise.resolve({
            kind: 'refused' as const,
            status: 400 as const,
            error: say('server.errors.thereIsNoSuchLibrary'),
          })
        : client.fileDownload(context.req.valid('param').id, { id: into.id, path: into.path }),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(pauseQueuedDownloadRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.pauseDownload(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(resumeQueuedDownloadRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.resumeDownload(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeQueuedDownloadRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.removeDownload(
        context.req.valid('param').id,
        context.req.valid('query').deleteData === 'true',
      ),
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(listIndexersRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.listIndexers();

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.kind === 'silent' ? answer.reason : answer.error }, 502);
  });

  app.openapi(addIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.addIndexer(context.req.valid('json'));

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, 400);
    }

    await recheckRequests();

    return context.json(answer.value, 201);
  });

  app.openapi(tryIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.tryIndexer(context.req.valid('json'));

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 400)
      : context.json(answer.value, 200);
  });

  app.openapi(changeIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.changeIndexer(
      context.req.valid('param').id,
      context.req.valid('json'),
    );

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return answer.status === 404
        ? context.json({ error: answer.error }, 404)
        : context.json({ error: answer.error }, 400);
    }

    await recheckRequests();

    return context.json(answer.value, 200);
  });

  app.openapi(removeIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.removeIndexer(context.req.valid('param').id);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, 404);
    }

    await recheckRequests();

    return context.body(null, 204);
  });

  app.openapi(testIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.testIndexer(context.req.valid('param').id);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, 404);
    }

    await recheckRequests();

    return context.json(answer.value, 200);
  });

  app.openapi(tryIndexerChangeRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.tryIndexer(
      context.req.valid('json'),
      context.req.valid('param').id,
    );

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 400)
      : context.json(answer.value, 200);
  });

  app.openapi(listDefinitionsRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.catalogue();

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.kind === 'silent' ? answer.reason : answer.error }, 502);
  });

  app.openapi(refreshDefinitionsRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.refreshCatalogue();

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.kind === 'silent' ? answer.reason : answer.error }, 502);
  });

  app.openapi(readDefinitionRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.definition(context.req.valid('param').id);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 404)
      : context.json(answer.value, 200);
  });

  app.post('/api/admin/requests/indexers/:id/download', async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const asked = ReleaseDownloadRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );

    if (!asked.success) {
      return context.json({ error: say('server.errors.sayWhichRelease') }, 400);
    }

    const answer = await client.download(context.req.param('id'), asked.data.url);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, answer.status);
    }

    if (answer.value.kind === 'magnet') {
      return context.json({ magnet: answer.value.url }, 200);
    }

    const isNzb = answer.value.contentType.includes('nzb');

    return context.body(answer.value.bytes.slice(), 200, {
      'content-type': answer.value.contentType,
      'content-disposition': `attachment; filename="release.${isNzb ? 'nzb' : 'torrent'}"`,
    });
  });

  app.openapi(searchReleasesRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(notYours(), 403);
    }

    if (client === 'off') {
      return context.json(requestingOff(), 404);
    }

    const answer = await client.search(context.req.valid('json'));

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 400)
      : context.json(answer.value, 200);
  });
};

export { serveRequests };
