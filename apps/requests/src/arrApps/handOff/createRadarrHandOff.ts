import { ArrReleaseSchema } from '@ValenceRequests/arrApps/schemas/ArrReleaseSchema';
import { dirname } from 'node:path';
import { z } from 'zod';
import { saying } from '@ValenceI18n/saying';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { HandOffHandler, ItemSighting } from '@ValenceRequests/arrApps/handOff/HandOffHandler';
import { ArrAcknowledgementSchema } from '@ValenceRequests/arrApps/schemas/ArrAcknowledgementSchema';
import { ArrCommandSchema } from '@ValenceRequests/arrApps/schemas/ArrCommandSchema';
import { ArrIdSchema } from '@ValenceRequests/arrApps/schemas/ArrIdSchema';
import { RadarrMovieSchema } from '@ValenceRequests/arrApps/schemas/RadarrMovieSchema';

const RadarrMoviesSchema = z.array(RadarrMovieSchema);

/**
 * Hands films to Radarr: adding a film it does not have yet, monitored, into the root folder and
 * quality profile its library chose and searched for at once where the library says so, or
 * monitoring and searching one it already has; and then reading whether Radarr has imported it,
 * or has it in its queue.
 *
 * @param caller - How to ask Radarr.
 * @returns The hand-off.
 */
const createRadarrHandOff = (caller: Pick<ArrCaller, 'read' | 'send'>): HandOffHandler => ({
  place: async (request, _items, handOff) => {
    if (request.tmdbId === null) {
      throw new ArrAppFailure(saying('requests.arrApps.handOff.itHasNoTmdbIdToHandOver'));
    }

    const [kept] = await caller.read('/movie', RadarrMoviesSchema, {
      tmdbId: request.tmdbId.toString(),
    });

    if (kept === undefined) {
      return (
        await caller.send(
          'POST',
          '/movie',
          {
            title: request.title,
            year: request.year ?? 0,
            tmdbId: request.tmdbId,
            qualityProfileId: handOff.qualityProfileId,
            rootFolderPath: handOff.rootFolderPath,
            monitored: true,
            minimumAvailability: 'released',
            addOptions: { searchForMovie: handOff.searchesOnAdd },
          },
          ArrIdSchema,
        )
      ).id;
    }

    if (!kept.monitored) {
      await caller.send(
        'PUT',
        '/movie/editor',
        { movieIds: [kept.id], monitored: true },
        ArrAcknowledgementSchema,
      );
    }

    if (!kept.hasFile && handOff.searchesOnAdd) {
      await caller.send(
        'POST',
        '/command',
        { name: 'MoviesSearch', movieIds: [kept.id] },
        ArrCommandSchema,
      );
    }

    return kept.id;
  },

  search: async (_request, handOffId) => {
    await caller.send(
      'POST',
      '/command',
      { name: 'MoviesSearch', movieIds: [handOffId] },
      ArrCommandSchema,
    );
  },

  releases: (_request, _items, handOffId) =>
    caller.read('/release', ArrReleaseSchema.array(), { movieId: handOffId.toString() }),

  pageOf: (request) =>
    Promise.resolve(request.tmdbId === null ? null : `/movie/${request.tmdbId.toString()}`),

  watch: async (_request, items, _handOff, handOffId, queue) => {
    const movie = await caller.read(`/movie/${handOffId.toString()}`, RadarrMovieSchema);
    const filePath = movie.hasFile ? (movie.movieFile?.path ?? null) : null;
    const queued = queue.find((record) => record.movieId === handOffId);

    return items.map((item): ItemSighting => {
      if (filePath !== null) {
        return {
          itemId: item.id,
          kind: 'imported',
          path: filePath,
          folder: movie.path ?? dirname(filePath),
        };
      }

      return queued === undefined
        ? { itemId: item.id, kind: 'missing' }
        : { itemId: item.id, kind: 'queued', record: queued };
    });
  },
});

export { createRadarrHandOff };
