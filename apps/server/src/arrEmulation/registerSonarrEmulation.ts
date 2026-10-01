import { z } from 'zod';
import { say } from '@ValenceI18n/say';
import { SEERR_SONARR_PATH } from '@ValenceContracts/schemas/SeerrLink';
import { arrIdOf } from '@ValenceServer/arrEmulation/arrIdOf';
import { episodeIdOf } from '@ValenceServer/arrEmulation/episodeIdOf';
import { isOnDisk } from '@ValenceServer/arrEmulation/isOnDisk';
import { pickArrLibrary } from '@ValenceServer/arrEmulation/pickArrLibrary';
import { pickArrProfile } from '@ValenceServer/arrEmulation/pickArrProfile';
import { readArrBody } from '@ValenceServer/arrEmulation/readArrBody';
import { registerArrCommon } from '@ValenceServer/arrEmulation/registerArrCommon';
import { seasonCountsOf } from '@ValenceServer/arrEmulation/seasonCountsOf';
import { sonarrSeriesOf } from '@ValenceServer/arrEmulation/sonarrSeriesOf';
import { titleOfRequest } from '@ValenceServer/arrEmulation/titleOfRequest';
import type { ArrEmulation, ArrLibrary } from '@ValenceServer/arrEmulation/ArrEmulation';
import type { SonarrSeries } from '@ValenceServer/arrEmulation/sonarrSeriesOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { Context } from 'hono';
import type { OpenAPIHono } from '@hono/zod-openapi';

const SONARR_VERSION = '3.0.10.1567';

const IdSchema = z.coerce.number().int().positive();

const LookupSchema = z
  .string()
  .regex(/^tvdb:\d+$/)
  .transform((term) => Number(term.slice('tvdb:'.length)));

const SonarrSeriesBodySchema = z.object({
  tvdbId: z.number().int().positive(),
  tmdbId: z.number().int().positive().optional(),
  qualityProfileId: z.number().int().optional(),
  rootFolderPath: z.string().max(4096).optional(),
  seasons: z
    .array(
      z.object({
        seasonNumber: z.number().int().nonnegative(),
        monitored: z.boolean().default(false),
      }),
    )
    .max(500)
    .default([]),
});

const MonitorSchema = z.object({
  episodeIds: z.array(z.number().int()).max(10_000),
  monitored: z.boolean(),
});

/**
 * Registers Valence standing in for Sonarr, for Overseerr or Jellyseerr to send series to: looking
 * one up by its TVDB id, adding it or more of its seasons — which asks Valence for those seasons,
 * approved — and saying how much of each season is in the library.
 *
 * @param app - The application to register it on.
 * @param emulation - What it answers with.
 */
const registerSonarrEmulation = (app: OpenAPIHono, emulation: ArrEmulation): void => {
  const api = `${SEERR_SONARR_PATH}/api/v3`;

  registerArrCommon(
    app,
    SEERR_SONARR_PATH,
    'series',
    // eslint-disable-next-line valence/no-hard-coded-strings -- the program Overseerr and Jellyseerr expect to be talking to, not words a person reads
    { appName: 'Sonarr', version: SONARR_VERSION },
    emulation,
  );

  const everySeries = async () =>
    (await emulation.requests()).filter(
      (request) => request.kind === 'series' && request.tmdbId !== null,
    );

  const seriesOf = async (
    tmdbId: number,
    request: MediaRequest | null,
    libraries: readonly ArrLibrary[],
    knownTvdbId: number | null = null,
  ): Promise<SonarrSeries | null> => {
    const [catalogue, held, holding] = await Promise.all([
      emulation.describe(tmdbId, 'series'),
      emulation.episodesHeld(tmdbId),
      emulation.seriesHeld([tmdbId.toString()]),
    ]);
    const tvdbId = catalogue?.tvdbId ?? knownTvdbId;
    const title = request === null ? catalogue : titleOfRequest(request);

    if (tvdbId === null || title === null) {
      return null;
    }

    return sonarrSeriesOf({
      tmdbId,
      tvdbId,
      title,
      isEnded: catalogue?.isEnded ?? false,
      seasons: seasonCountsOf(
        catalogue === null || catalogue.episodes.length === 0
          ? (request?.items ?? [])
          : catalogue.episodes,
      ),
      held,
      request,
      isHeld: holding.has(tmdbId.toString()),
      qualityProfileId:
        request === null || request.profileId === null ? 1 : arrIdOf(request.profileId),
      rootFolderPath:
        (libraries.find((library) => library.id === request?.libraryId) ?? libraries[0])?.path ??
        '',
    });
  };

  const add = async (context: Context, status: 201 | 202) => {
    const read = await readArrBody(context.req.raw, SonarrSeriesBodySchema);

    if (read === null) {
      return context.json({ message: say('server.arrEmulation.thatIsNotWhatWasExpected') }, 400);
    }

    const tmdbId = read.tmdbId ?? (await emulation.seriesOfTvdbId(read.tvdbId));

    if (tmdbId === null) {
      return context.json(
        { message: say('server.arrEmulation.theCatalogueKnowsNoSeriesByThat') },
        400,
      );
    }

    const [profiles, libraries] = await Promise.all([
      emulation.profiles(),
      emulation.libraries('series'),
    ]);
    const watched = read.seasons
      .filter((season) => season.monitored)
      .map((season) => season.seasonNumber);
    const asked = await emulation.ask({
      kind: 'series',
      tmdbId,
      seasons: watched.length === 0 ? null : watched,
      profileId: pickArrProfile(profiles, read.qualityProfileId),
      libraryId: pickArrLibrary(libraries, read.rootFolderPath)?.id,
    });

    if (asked.kind === 'refused') {
      return context.json({ message: asked.message }, asked.status);
    }

    const series = await seriesOf(tmdbId, asked.request, libraries, read.tvdbId);

    return series === null
      ? context.json({ message: say('server.arrEmulation.theCatalogueKnowsNoSeriesByThat') }, 400)
      : context.json(series, status);
  };

  app.get(`${api}/series/lookup`, async (context) => {
    const term = LookupSchema.safeParse(context.req.query('term'));

    if (!term.success) {
      return context.json([], 200);
    }

    const tmdbId = await emulation.seriesOfTvdbId(term.data);

    if (tmdbId === null) {
      return context.json([], 200);
    }

    const [requested, libraries] = await Promise.all([
      everySeries(),
      emulation.libraries('series'),
    ]);
    const series = await seriesOf(
      tmdbId,
      requested.find((request) => request.tmdbId === tmdbId) ?? null,
      libraries,
      term.data,
    );

    return context.json(series === null ? [] : [series], 200);
  });

  app.get(`${api}/series`, async (context) => {
    const wanted = IdSchema.safeParse(context.req.query('tvdbId'));
    const [requested, libraries] = await Promise.all([
      everySeries(),
      emulation.libraries('series'),
    ]);
    const described = await Promise.all(
      requested
        .filter((request) => request.approval !== 'refused')
        .map((request) => seriesOf(request.tmdbId ?? 0, request, libraries)),
    );

    return context.json(
      described.filter(
        (series): series is SonarrSeries =>
          series !== null && (!wanted.success || series.tvdbId === wanted.data),
      ),
      200,
    );
  });

  app.get(`${api}/series/:id`, async (context) => {
    const id = IdSchema.safeParse(context.req.param('id'));

    if (!id.success) {
      return context.json({ message: say('server.arrEmulation.valenceHasNothingByThatId') }, 404);
    }

    const [requested, libraries, holding] = await Promise.all([
      everySeries(),
      emulation.libraries('series'),
      emulation.seriesHeld([id.data.toString()]),
    ]);
    const request = requested.find((one) => one.tmdbId === id.data) ?? null;
    const series =
      request === null && !holding.has(id.data.toString())
        ? null
        : await seriesOf(id.data, request, libraries);

    return series === null
      ? context.json({ message: say('server.arrEmulation.valenceHasNothingByThatId') }, 404)
      : context.json(series, 200);
  });

  app.post(`${api}/series`, (context) => add(context, 201));

  app.put(`${api}/series`, (context) => add(context, 202));

  app.put(`${api}/series/:id`, (context) => add(context, 202));

  app.delete(`${api}/series/:id`, async (context) => {
    const id = IdSchema.safeParse(context.req.param('id'));
    const request = id.success
      ? (await everySeries()).find((one) => one.tmdbId === id.data)
      : undefined;

    if (request === undefined) {
      return context.json({ message: say('server.arrEmulation.valenceHasNothingByThatId') }, 404);
    }

    if (!isOnDisk(request)) {
      await emulation.withdraw(request);
    }

    return context.json({}, 200);
  });

  app.get(`${api}/episode`, async (context) => {
    const id = IdSchema.safeParse(context.req.query('seriesId'));

    if (!id.success) {
      return context.json([], 200);
    }

    const [catalogue, requested] = await Promise.all([
      emulation.describe(id.data, 'series'),
      everySeries(),
    ]);
    const request = requested.find((one) => one.tmdbId === id.data);
    const isWatched = (season: number) =>
      request?.approval === 'approved' &&
      (request.seasons === null || request.seasons.includes(season));

    return context.json(
      (catalogue?.episodes ?? []).map((episode) => ({
        id: episodeIdOf(episode.season, episode.episode),
        seriesId: id.data,
        seasonNumber: episode.season,
        episodeNumber: episode.episode,
        title: episode.title,
        airDate: episode.airDate ?? '',
        monitored: isWatched(episode.season),
        hasFile: false,
      })),
      200,
    );
  });

  app.put(`${api}/episode/monitor`, async (context) => {
    const read = await readArrBody(context.req.raw, MonitorSchema);

    return read === null
      ? context.json({ message: say('server.arrEmulation.thatIsNotWhatWasExpected') }, 400)
      : context.json([], 202);
  });

  app.get(`${api}/languageprofile`, (context) =>
    context.json([{ id: 1, name: say('server.arrEmulation.english') }], 200),
  );
};

export { registerSonarrEmulation };
