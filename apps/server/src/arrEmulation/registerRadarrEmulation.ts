import { z } from 'zod';
import { say } from '@ValenceI18n/say';
import { SEERR_RADARR_PATH } from '@ValenceContracts/schemas/SeerrLink';
import { arrIdOf } from '@ValenceServer/arrEmulation/arrIdOf';
import { isOnDisk } from '@ValenceServer/arrEmulation/isOnDisk';
import { pickArrLibrary } from '@ValenceServer/arrEmulation/pickArrLibrary';
import { pickArrProfile } from '@ValenceServer/arrEmulation/pickArrProfile';
import { radarrMovieOf } from '@ValenceServer/arrEmulation/radarrMovieOf';
import { readArrBody } from '@ValenceServer/arrEmulation/readArrBody';
import { registerArrCommon } from '@ValenceServer/arrEmulation/registerArrCommon';
import { titleOfRequest } from '@ValenceServer/arrEmulation/titleOfRequest';
import type { ArrEmulation, ArrLibrary } from '@ValenceServer/arrEmulation/ArrEmulation';
import type { ArrTitle } from '@ValenceServer/arrEmulation/folderOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { Context } from 'hono';
import type { OpenAPIHono } from '@hono/zod-openapi';

const RADARR_VERSION = '3.2.2.5080';

const IdSchema = z.coerce.number().int().positive();

const LookupSchema = z
  .string()
  .regex(/^tmdb:\d+$/)
  .transform((term) => Number(term.slice('tmdb:'.length)));

const RadarrMovieBodySchema = z.object({
  tmdbId: z.number().int().positive(),
  qualityProfileId: z.number().int().optional(),
  profileId: z.number().int().optional(),
  rootFolderPath: z.string().max(4096).optional(),
});

/**
 * Registers Valence standing in for Radarr, for Overseerr or Jellyseerr to send films to: looking a
 * film up, adding it — which asks Valence for it, approved — and saying where each one asked for has
 * got to, from the queue to its file being in the library.
 *
 * @param app - The application to register it on.
 * @param emulation - What it answers with.
 */
const registerRadarrEmulation = (app: OpenAPIHono, emulation: ArrEmulation): void => {
  const api = `${SEERR_RADARR_PATH}/api/v3`;

  registerArrCommon(
    app,
    SEERR_RADARR_PATH,
    'film',
    // oxlint-disable-next-line valence/no-hard-coded-strings -- the program Overseerr and Jellyseerr expect to be talking to, not words a person reads
    { appName: 'Radarr', version: RADARR_VERSION },
    emulation,
  );

  const films = async () =>
    (await emulation.requests()).filter(
      (request) => request.kind === 'film' && request.tmdbId !== null,
    );

  const movieOf = (
    tmdbId: number,
    title: ArrTitle,
    request: MediaRequest | null,
    isHeld: boolean,
    libraries: readonly ArrLibrary[],
  ) =>
    radarrMovieOf({
      tmdbId,
      title,
      request,
      isHeld,
      qualityProfileId:
        request === null || request.profileId === null ? 1 : arrIdOf(request.profileId),
      rootFolderPath:
        (libraries.find((library) => library.id === request?.libraryId) ?? libraries[0])?.path ??
        '',
    });

  const describeOne = async (tmdbId: number) => {
    const [requested, held, libraries] = await Promise.all([
      films(),
      emulation.filmsHeld([tmdbId.toString()]),
      emulation.libraries('film'),
    ]);
    const request = requested.find((one) => one.tmdbId === tmdbId) ?? null;
    const isHeld = held.has(tmdbId.toString());

    if (request !== null) {
      return movieOf(tmdbId, titleOfRequest(request), request, isHeld, libraries);
    }

    const catalogue = await emulation.describe(tmdbId, 'film');

    return catalogue === null ? null : movieOf(tmdbId, catalogue, null, isHeld, libraries);
  };

  const add = async (context: Context, status: 201 | 202) => {
    const read = await readArrBody(context.req.raw, RadarrMovieBodySchema);

    if (read === null) {
      return context.json({ message: say('server.arrEmulation.thatIsNotWhatWasExpected') }, 400);
    }

    const [profiles, libraries] = await Promise.all([
      emulation.profiles(),
      emulation.libraries('film'),
    ]);
    const asked = await emulation.ask({
      kind: 'film',
      tmdbId: read.tmdbId,
      seasons: null,
      profileId: pickArrProfile(profiles, read.qualityProfileId ?? read.profileId),
      libraryId: pickArrLibrary(libraries, read.rootFolderPath)?.id,
    });

    if (asked.kind === 'refused') {
      return context.json({ message: asked.message }, asked.status);
    }

    const held = await emulation.filmsHeld([read.tmdbId.toString()]);

    return context.json(
      movieOf(
        read.tmdbId,
        titleOfRequest(asked.request),
        asked.request,
        held.has(read.tmdbId.toString()),
        libraries,
      ),
      status,
    );
  };

  app.get(`${api}/movie/lookup`, async (context) => {
    const term = LookupSchema.safeParse(context.req.query('term'));

    if (!term.success) {
      return context.json([], 200);
    }

    const movie = await describeOne(term.data);

    return context.json(movie === null ? [] : [movie], 200);
  });

  app.get(`${api}/movie`, async (context) => {
    const wanted = IdSchema.safeParse(context.req.query('tmdbId'));
    const [requested, libraries] = await Promise.all([films(), emulation.libraries('film')]);
    const listed = requested.filter(
      (request) =>
        request.approval !== 'refused' && (!wanted.success || request.tmdbId === wanted.data),
    );
    const held = await emulation.filmsHeld(
      listed.map((request) => (request.tmdbId ?? 0).toString()),
    );

    return context.json(
      listed.map((request) => {
        const tmdbId = request.tmdbId ?? 0;

        return movieOf(
          tmdbId,
          titleOfRequest(request),
          request,
          held.has(tmdbId.toString()),
          libraries,
        );
      }),
      200,
    );
  });

  app.get(`${api}/movie/:id`, async (context) => {
    const id = IdSchema.safeParse(context.req.param('id'));
    const movie = id.success ? await describeOne(id.data) : null;

    return movie?.id === undefined
      ? context.json({ message: say('server.arrEmulation.valenceHasNothingByThatId') }, 404)
      : context.json(movie, 200);
  });

  app.post(`${api}/movie`, (context) => add(context, 201));

  app.put(`${api}/movie`, (context) => add(context, 202));

  app.put(`${api}/movie/:id`, (context) => add(context, 202));

  app.delete(`${api}/movie/:id`, async (context) => {
    const id = IdSchema.safeParse(context.req.param('id'));
    const request = id.success ? (await films()).find((one) => one.tmdbId === id.data) : undefined;

    if (request === undefined) {
      return context.json({ message: say('server.arrEmulation.valenceHasNothingByThatId') }, 404);
    }

    if (!isOnDisk(request)) {
      await emulation.withdraw(request);
    }

    return context.json({}, 200);
  });
};

export { registerRadarrEmulation };
