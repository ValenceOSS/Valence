import { z } from 'zod';
import { say } from '@ValenceI18n/say';
import { arrIdOf } from '@ValenceServer/arrEmulation/arrIdOf';
import { arrQueueOf } from '@ValenceServer/arrEmulation/arrQueueOf';
import { isTheSeerrKey } from '@ValenceServer/arrEmulation/isTheSeerrKey';
import { LIBRARY_DEFAULT_PROFILE } from '@ValenceServer/arrEmulation/LIBRARY_DEFAULT_PROFILE';
import { readArrBody } from '@ValenceServer/arrEmulation/readArrBody';
import type { ArrEmulation, ArrKind } from '@ValenceServer/arrEmulation/ArrEmulation';
import type { OpenAPIHono } from '@hono/zod-openapi';

type ArrApp = {
  appName: 'Radarr' | 'Sonarr';
  version: string;
};

const TagSchema = z.object({ label: z.string().trim().min(1).max(200) });

const CommandSchema = z.object({ name: z.string().min(1).max(100) });

/**
 * A whole number of a tag's own, from its name, so the same tag asked for twice is the same tag.
 *
 * @param label - The tag's name.
 * @returns A positive whole number.
 */
const tagIdOf = (label: string): number =>
  [...label].reduce(
    (hash, character) => (hash * 31 + (character.codePointAt(0) ?? 0)) % 2_147_483_647,
    7,
  ) || 1;

/**
 * Registers what Radarr and Sonarr answer alike under one base: who they say they are, the quality
 * profiles, the root folders, the tags, the commands and the queue — behind the key Valence made for
 * Overseerr or Jellyseerr, and only while answering them is turned on.
 *
 * @param app - The application to register them on.
 * @param base - Where this stand-in answers, such as `/arr/radarr`.
 * @param kind - Whether this one stands in for Radarr's films or Sonarr's series.
 * @param who - The name and version it answers as.
 * @param emulation - What it answers with.
 */
const registerArrCommon = (
  app: OpenAPIHono,
  base: string,
  kind: ArrKind,
  who: ArrApp,
  emulation: ArrEmulation,
): void => {
  const api = `${base}/api/v3`;

  app.use(`${base}/*`, async (context, next) => {
    const link = await emulation.readLink();

    if (!link.isEnabled) {
      return context.json({ message: say('server.arrEmulation.answeringSeerrIsOff') }, 404);
    }

    if (!isTheSeerrKey(context.req.raw, link.apiKey)) {
      return context.json({ message: say('server.arrEmulation.thatKeyIsNotTheOne') }, 401);
    }

    if (!emulation.isRequestingOn) {
      return context.json({ message: say('error.common.requestingIsOff') }, 503);
    }

    await next();

    return undefined;
  });

  app.get(`${api}/system/status`, (context) =>
    context.json(
      {
        appName: who.appName,
        instanceName: say('common.valence'),
        version: who.version,
        urlBase: base,
        isProduction: true,
        isDocker: true,
        authentication: 'apiKey',
        branch: 'main',
        startTime: new Date().toISOString(),
      },
      200,
    ),
  );

  app.get(`${api}/health`, async (context) =>
    context.json(
      (await emulation.libraries(kind)).length > 0
        ? []
        : [
            {
              source: 'RootFolderCheck',
              type: 'error',
              message: say(
                kind === 'film'
                  ? 'server.arrEmulation.noFilmsLibraryTakesRequests'
                  : 'server.arrEmulation.noShowsLibraryTakesRequests',
              ),
              wikiUrl: null,
            },
          ],
      200,
    ),
  );

  for (const path of ['qualityprofile', 'qualityProfile']) {
    app.get(`${api}/${path}`, async (context) =>
      context.json(
        [LIBRARY_DEFAULT_PROFILE, ...(await emulation.profiles())].map((profile) => ({
          id: profile === LIBRARY_DEFAULT_PROFILE ? 1 : arrIdOf(profile.id),
          name: profile.name,
          upgradeAllowed: true,
          cutoff: 1,
          items: [],
        })),
        200,
      ),
    );
  }

  app.get(`${api}/rootfolder`, async (context) =>
    context.json(
      (await emulation.libraries(kind)).map((library) => ({
        id: arrIdOf(library.id),
        path: library.path,
        accessible: true,
        freeSpace: library.freeBytes,
        totalSpace: library.totalBytes,
        unmappedFolders: [],
      })),
      200,
    ),
  );

  app.get(`${api}/tag`, (context) => context.json([], 200));

  app.post(`${api}/tag`, async (context) => {
    const read = await readArrBody(context.req.raw, TagSchema);

    return read === null
      ? context.json({ message: say('server.arrEmulation.thatIsNotWhatWasExpected') }, 400)
      : context.json({ id: tagIdOf(read.label), label: read.label }, 201);
  });

  app.put(`${api}/tag/:id`, async (context) => {
    const read = await readArrBody(context.req.raw, TagSchema);

    return read === null
      ? context.json({ message: say('server.arrEmulation.thatIsNotWhatWasExpected') }, 400)
      : context.json({ id: tagIdOf(read.label), label: read.label }, 202);
  });

  app.post(`${api}/command`, async (context) => {
    const read = await readArrBody(context.req.raw, CommandSchema);

    return read === null
      ? context.json({ message: say('server.arrEmulation.thatIsNotWhatWasExpected') }, 400)
      : context.json(
          {
            id: 1,
            name: read.name,
            commandName: read.name,
            status: 'completed',
            trigger: 'manual',
            queued: new Date().toISOString(),
          },
          201,
        );
  });

  app.get(`${api}/queue`, async (context) => {
    const [requests, downloads] = await Promise.all([emulation.requests(), emulation.downloads()]);

    return context.json(arrQueueOf(kind, requests, downloads, new Date()), 200);
  });
};

export { registerArrCommon };

export type { ArrApp };
