import { say } from '@ValenceI18n/say';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  adminOverviewRoute,
  adminLogsRoute,
  adminLogHistogramRoute,
  adminLogFacetsRoute,
  adminJobStatsRoute,
  adminJobRunRoute,
  adminMeasureStorageRoute,
  searchCatalogueRoute,
  adminSettingsRoute,
  adminSessionsRoute,
  adminStopSessionRoute,
  adminPauseSessionRoute,
  adminMessageSessionRoute,
  adminResumeSessionRoute,
  adminJobDefinitionsRoute,
  adminRunJobRoute,
  adminCancelJobRoute,
  adminQueueConcurrencyRoute,
  adminQueuePauseRoute,
  adminQueueResumeRoute,
  adminQueueRunNowRoute,
  adminJobSchedulesRoute,
  adminAddJobTriggerRoute,
  adminRemoveJobTriggerRoute,
  adminJobHistoryRoute,
  adminJobHistoryIssuesRoute,
  adminMonitorHistoryRoute,
} from '@ValenceServer/routes/AdminRoute';
import { RESET_LIBRARY_JOB } from '@ValenceServer/jobs/jobDefinitions';
import {
  SCAN_LIBRARY_JOB,
  REGENERATE_PREVIEWS_JOB,
  REGENERATE_TRICKPLAY_JOB,
  FETCH_LOGOS_JOB,
  CLEAR_LIBRARY_PARTS_JOB,
  DETECT_SEGMENTS_JOB,
  READ_CERTIFICATES_AGAIN_JOB,
} from '@ValenceServer/jobs/JobQueue';
import { listeningFor } from '@ValenceServer/music/listeningFor';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the admin endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAdmin = (app: OpenAPIHono, context: AppContext): void => {
  const {
    settings,
    library,
    playback,
    maintenance,
    schedules,
    presence,
    splashscreen,
    music,
    listUsers,
    capabilities,
    artworkUsage,
    bookPageUsage,
    libraryBytes,
    measureStorage,
    stalledJobs,
    isTranscoderReachable,
    transcoderAddress,
    jobDefinitions,
    cancelJob,
    controlQueue,
    searchCatalogue,
    logs,
    jobHistory,
    resourceHistory,
    within,
    requires,
  } = context;

  app.openapi(searchCatalogueRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { query, kind } = context.req.valid('query');

    return context.json({ matches: await searchCatalogue(query, kind) }, 200);
  });

  app.openapi(adminLogsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.logs'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (logs === undefined) {
      return context.json({ records: [], total: 0 }, 200);
    }

    return context.json(await logs.read(context.req.valid('json')), 200);
  });

  app.openapi(adminLogHistogramRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.logs'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const query = context.req.valid('json');

    if (logs === undefined) {
      const untilMs = query.untilMs ?? Date.now();

      return context.json(
        { fromMs: query.sinceMs ?? untilMs - 3_600_000, untilMs, bucketMs: 60_000, buckets: [] },
        200,
      );
    }

    return context.json(await logs.histogram(query, Date.now()), 200);
  });

  app.openapi(adminLogFacetsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.logs'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (logs === undefined) {
      return context.json({ sources: [], jobKinds: [] }, 200);
    }

    return context.json(await logs.facets(context.req.valid('json')), 200);
  });

  app.openapi(adminMeasureStorageRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const measured = await measureStorage?.();

    return context.json(
      {
        cache: measured?.cache ?? null,
        artwork: measured?.artwork ?? null,
        bookPages: measured?.bookPages ?? null,
        libraryBytes: measured?.libraryBytes ?? 0,
      },
      200,
    );
  });

  app.openapi(adminOverviewRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const [users, current, libraries, transcoderCapabilities, isReachable] = await Promise.all([
      listUsers?.() ?? Promise.resolve([]),
      settings.read(),
      library.list(asTheServer),
      within(capabilities?.().catch(() => null) ?? Promise.resolve(null), null),
      within(isTranscoderReachable(), false),
    ]);

    return context.json(
      {
        users,
        settings: {
          hasCatalogueKey: current.catalogueApiKey !== '',
          hasAudioDbKey: current.audioDbKey !== '',
          hasOmdbKey: current.omdbKey !== '',
          hardwareAccel: current.hardwareAccel,
          previewQuality: current.previewQuality,
          certificationRegion: current.certificationRegion,
          showsProfilesBeforeSignIn: current.showsProfilesBeforeSignIn,
          fetchesCatalogueTrailers: current.fetchesCatalogueTrailers,
          fetchesMusicDetails: current.fetchesMusicDetails,
          requestReleaseTypes: current.requestReleaseTypes,
          roundness: current.roundness,
          keepsDownloadsForDays: current.keepsDownloadsForDays,
          splashscreen: await splashscreen.address(),
          trustedOrigins: current.trustedOrigins,
          cookieSecure: current.cookieSecure,
        },
        transcoder: {
          isReachable,
          address: transcoderAddress,
          ffmpegVersion: transcoderCapabilities?.ffmpegVersion ?? null,
          ffmpegSupported: transcoderCapabilities?.ffmpegSupported ?? true,
          hardwareAccels: transcoderCapabilities?.hardwareAccels ?? [],
          chains: transcoderCapabilities?.chains ?? [],
          concurrentRenders: transcoderCapabilities?.concurrentRenders ?? 0,
          toneMapping: transcoderCapabilities?.toneMapping ?? 'unavailable',
          hardwareToneMaps: transcoderCapabilities?.hardwareToneMaps ?? [],
        },
        library: {
          libraryCount: libraries.length,
          itemCount: libraries.reduce((total, entry) => total + entry.itemCount, 0),
          bytes: await (libraryBytes?.() ?? Promise.resolve(0)),
        },
        artwork: artworkUsage?.() ?? null,
        bookPages: bookPageUsage?.() ?? null,
        jobs: { stalled: stalledJobs?.() ?? [] },
      },
      200,
    );
  });

  app.openapi(adminSettingsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const patch = context.req.valid('json');
    const before = await settings.read();

    const updated = await settings.write({
      ...(patch.catalogueApiKey === undefined ? {} : { catalogueApiKey: patch.catalogueApiKey }),
      ...(patch.audioDbKey === undefined ? {} : { audioDbKey: patch.audioDbKey }),
      ...(patch.omdbKey === undefined ? {} : { omdbKey: patch.omdbKey }),
      ...(patch.hardwareAccel === undefined ? {} : { hardwareAccel: patch.hardwareAccel }),
      ...(patch.previewQuality === undefined ? {} : { previewQuality: patch.previewQuality }),
      ...(patch.certificationRegion === undefined
        ? {}
        : { certificationRegion: patch.certificationRegion.toUpperCase() }),
      ...(patch.showsProfilesBeforeSignIn === undefined
        ? {}
        : { showsProfilesBeforeSignIn: patch.showsProfilesBeforeSignIn }),
      ...(patch.fetchesCatalogueTrailers === undefined
        ? {}
        : { fetchesCatalogueTrailers: patch.fetchesCatalogueTrailers }),
      ...(patch.fetchesMusicDetails === undefined
        ? {}
        : { fetchesMusicDetails: patch.fetchesMusicDetails }),
      ...(patch.requestReleaseTypes === undefined
        ? {}
        : { requestReleaseTypes: patch.requestReleaseTypes }),
      ...(patch.roundness === undefined ? {} : { roundness: patch.roundness }),
      ...(patch.keepsDownloadsForDays === undefined
        ? {}
        : { keepsDownloadsForDays: patch.keepsDownloadsForDays }),
    });

    if (updated.certificationRegion !== before.certificationRegion) {
      await maintenance.run(READ_CERTIFICATES_AGAIN_JOB);
    }

    if (updated.previewQuality !== before.previewQuality) {
      const libraries = await library.list(asTheServer);

      await Promise.all(
        libraries
          .filter((entry) => entry.kind !== 'books')
          .map((entry) => library.remakePreviews(entry.id)),
      );
    }

    return context.json(
      {
        hasCatalogueKey: updated.catalogueApiKey !== '',
        hasAudioDbKey: updated.audioDbKey !== '',
        hasOmdbKey: updated.omdbKey !== '',
        trustedOrigins: updated.trustedOrigins,
        cookieSecure: updated.cookieSecure,
        hardwareAccel: updated.hardwareAccel,
        previewQuality: updated.previewQuality,
        certificationRegion: updated.certificationRegion,
        showsProfilesBeforeSignIn: updated.showsProfilesBeforeSignIn,
        fetchesCatalogueTrailers: updated.fetchesCatalogueTrailers,
        fetchesMusicDetails: updated.fetchesMusicDetails,
        requestReleaseTypes: updated.requestReleaseTypes,
        roundness: updated.roundness,
        keepsDownloadsForDays: updated.keepsDownloadsForDays,
        splashscreen: await splashscreen.address(),
      },
      200,
    );
  });

  app.openapi(adminSessionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.view'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const listeningOn = async (clientId: string) => {
      const nowPlaying = music?.devices.playingOn(clientId) ?? null;

      if (music === undefined || nowPlaying === null) {
        return null;
      }

      return listeningFor(
        nowPlaying,
        await music.library.readTrackFile(asTheServer, nowPlaying.trackId),
      );
    };

    return context.json(
      await Promise.all(
        presence.list().map(async (entry) => ({
          clientId: entry.clientId,
          accountId: entry.accountId,
          profileId: entry.profileId,
          profileName: entry.profileName,
          isGuest: entry.viaShare !== null,
          guestOf: entry.guestOf,
          deviceLabel: entry.deviceLabel,
          clientKind: entry.clientKind ?? 'browser',
          connectedAt: entry.connectedAt,
          playback: entry.playback,
          listening: await listeningOn(entry.clientId),
        })),
      ),
      200,
    );
  });

  app.openapi(adminStopSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.stop'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { clientId } = context.req.valid('param');

    if (music?.devices.order(clientId, { kind: 'stop' }) === true) {
      return context.body(null, 204);
    }

    const transcoderSessionId = presence.list().find((entry) => entry.clientId === clientId)
      ?.playback?.transcoderSessionId;

    if (transcoderSessionId !== null && transcoderSessionId !== undefined) {
      await playback.stop(transcoderSessionId, clientId);
    }

    if (!presence.stop(clientId, say('server.presence.stoppedByAdmin'))) {
      return context.json({ error: say('server.errors.tabNotOpen') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminPauseSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.pause'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { clientId } = context.req.valid('param');
    const entry = presence.list().find((candidate) => candidate.clientId === clientId);

    if (entry === undefined) {
      return context.json({ error: say('server.errors.tabNotOpen') }, 404);
    }

    if (
      !presence.pause(clientId, say('server.presence.pausedByAdmin')) &&
      music?.devices.order(clientId, { kind: 'pause' }) !== true
    ) {
      return context.json({ error: say('server.errors.tabNotWatching') }, 409);
    }

    return context.body(null, 204);
  });

  app.openapi(adminMessageSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.message'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { clientId } = context.req.valid('param');

    if (!presence.message(clientId, context.req.valid('json').text)) {
      return context.json({ error: say('server.errors.tabNotOpen') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminResumeSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.pause'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { clientId } = context.req.valid('param');
    const isListening = music?.devices.order(clientId, { kind: 'resume' }) === true;

    if (!presence.resume(clientId) && !isListening) {
      return context.json({ error: say('server.errors.tabNotOpen') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminJobDefinitionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    return context.json(
      {
        definitions: jobDefinitions.map(({ labelKey, descriptionKey, ...definition }) => ({
          ...definition,
          label: say(labelKey),
          description: say(descriptionKey),
        })),
      },
      200,
    );
  });

  app.openapi(adminRunJobRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { kind } = context.req.valid('param');
    const { libraryId, force, parts } = context.req.valid('json');

    const definition = jobDefinitions.find((job) => job.kind === kind);

    if (
      definition?.destructive === true &&
      !(await requires(context.req.raw.headers, 'jobs.runDestructive'))
    ) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (definition !== undefined && !definition.needsLibrary) {
      const asked = await maintenance.run(kind);

      return asked.jobId === null
        ? context.json({ error: say('server.errors.nothingRunningThat') }, 404)
        : context.json({ jobId: asked.jobId, state: asked.state }, 202);
    }

    if (libraryId === undefined) {
      return context.json({ error: say('server.errors.jobNeedsLibrary') }, 404);
    }

    if (definition?.takesParts === true && parts === undefined) {
      return context.json({ error: say('server.errors.sayWhichPartsToClear') }, 400);
    }

    const libraryRunners: Record<string, () => Promise<{ jobId: string; state: string } | null>> = {
      [SCAN_LIBRARY_JOB]: () => library.scan(libraryId, force ?? false),
      [REGENERATE_PREVIEWS_JOB]: () => library.regeneratePreviews(libraryId),
      [REGENERATE_TRICKPLAY_JOB]: () => library.regenerateTrickplay(libraryId),
      [FETCH_LOGOS_JOB]: () => library.fetchLogos(libraryId),
      [DETECT_SEGMENTS_JOB]: () => library.detectSegments(libraryId),
      [RESET_LIBRARY_JOB]: () => library.reset(libraryId),
      [CLEAR_LIBRARY_PARTS_JOB]: () => library.clearParts(libraryId, parts ?? []),
    };

    const runner = libraryRunners[kind];

    if (runner === undefined) {
      return context.json({ error: say('server.errors.noSuchJobKind') }, 404);
    }

    const queued = await runner();

    if (queued === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json(queued, 202);
  });

  app.openapi(adminCancelJobRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { jobId } = context.req.valid('param');

    return (await cancelJob(jobId))
      ? context.json({ jobId }, 202)
      : context.json({ error: say('server.errors.nothingRunningUnderId') }, 404);
  });

  app.openapi(adminQueueConcurrencyRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { concurrency } = context.req.valid('json');

    try {
      await controlQueue?.setConcurrency(concurrency);
    } catch {
      return context.json({ error: say('server.errors.mediaServiceUnreachable') }, 502);
    }

    return context.json({ concurrency }, 200);
  });

  app.openapi(adminQueuePauseRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    try {
      await controlQueue?.pause();
    } catch {
      return context.json({ error: say('server.errors.mediaServiceUnreachable') }, 502);
    }

    return context.json({ isPaused: true as const }, 200);
  });

  app.openapi(adminQueueResumeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    try {
      await controlQueue?.resume();
    } catch {
      return context.json({ error: say('server.errors.mediaServiceUnreachable') }, 502);
    }

    return context.json({ isPaused: false as const }, 200);
  });

  app.openapi(adminQueueRunNowRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { jobId } = context.req.valid('param');

    try {
      return (await controlQueue?.runNow(jobId)) === true
        ? context.json({ jobId }, 202)
        : context.json({ error: say('server.errors.noSuchJobWaiting') }, 404);
    } catch {
      return context.json({ error: say('server.errors.mediaServiceUnreachable') }, 502);
    }
  });

  app.openapi(adminJobHistoryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (jobHistory === undefined) {
      return context.json({ records: [], total: 0 }, 200);
    }

    const asked = context.req.valid('query');

    return context.json(
      await jobHistory.read({
        kind: asked.kind ?? null,
        status: asked.status ?? null,
        search: asked.search ?? '',
        sinceMs: asked.sinceMs ?? null,
        untilMs: asked.untilMs ?? null,
        sort: asked.sort ?? 'newest',
        offset: asked.offset ?? 0,
        limit: asked.limit ?? 200,
      }),
      200,
    );
  });

  app.openapi(adminJobStatsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const sinceMs = context.req.valid('query').sinceMs ?? Date.now() - 7 * 86_400_000;

    return context.json({ sinceMs, kinds: (await jobHistory?.readStats(sinceMs)) ?? [] }, 200);
  });

  app.openapi(adminJobRunRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const found = await jobHistory?.readOne(context.req.valid('param').jobRunId);

    return found === undefined || found === null
      ? context.json({ error: say('server.errors.runNotInHistory') }, 404)
      : context.json(found, 200);
  });

  app.openapi(adminJobHistoryIssuesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (jobHistory === undefined) {
      return context.json([], 200);
    }

    const { jobRunId } = context.req.valid('param');

    return context.json(await jobHistory.readIssues(jobRunId), 200);
  });

  app.openapi(adminJobSchedulesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.schedule'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    return context.json(
      { schedules: await schedules.list(), timezone: await schedules.timezone() },
      200,
    );
  });

  app.openapi(adminAddJobTriggerRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.schedule'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { kind } = context.req.valid('param');
    const { trigger } = context.req.valid('json');
    const added = await schedules.add(kind, trigger);

    if (added === null) {
      return context.json({ error: say('server.errors.noSuchJobKind') }, 404);
    }

    return context.json(added, 201);
  });

  app.openapi(adminRemoveJobTriggerRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.schedule'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { kind, triggerId } = context.req.valid('param');

    if (!(await schedules.remove(kind, triggerId))) {
      return context.json({ error: say('server.errors.noSuchTrigger') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminMonitorHistoryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (resourceHistory === undefined) {
      return context.json({ records: [] }, 200);
    }

    const { range } = context.req.valid('query');

    return context.json({ records: await resourceHistory.read(range ?? '24h') }, 200);
  });
};

export { serveAdmin };
