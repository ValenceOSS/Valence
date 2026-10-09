import { ArrReleaseSchema } from '@ValenceRequests/arrApps/schemas/ArrReleaseSchema';
import { dirname } from 'node:path';
import { z } from 'zod';
import { saying } from '@ValenceI18n/saying';
import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { HandOffHandler, ItemSighting } from '@ValenceRequests/arrApps/handOff/HandOffHandler';
import { ArrAcknowledgementSchema } from '@ValenceRequests/arrApps/schemas/ArrAcknowledgementSchema';
import { ArrCommandSchema } from '@ValenceRequests/arrApps/schemas/ArrCommandSchema';
import { ArrFileSchema } from '@ValenceRequests/arrApps/schemas/ArrFileSchema';
import { ArrIdSchema } from '@ValenceRequests/arrApps/schemas/ArrIdSchema';
import { SonarrEpisodeSchema } from '@ValenceRequests/arrApps/schemas/SonarrEpisodeSchema';
import type { SonarrEpisode } from '@ValenceRequests/arrApps/schemas/SonarrEpisodeSchema';
import { SonarrSeriesSchema } from '@ValenceRequests/arrApps/schemas/SonarrSeriesSchema';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';
import { isSeasonWanted } from '@ValenceRequests/mediaRequests/isSeasonWanted';

const SonarrSeriesListSchema = z.array(SonarrSeriesSchema);

const SonarrEpisodesSchema = z.array(SonarrEpisodeSchema);

const ArrFilesSchema = z.array(ArrFileSchema);

const SETTLED = new Set<RequestItemRecord['state']>(['filed', 'available']);

/**
 * Hands series to Sonarr by their TVDB id — or, where the catalogue gave none, by asking Sonarr to
 * find them by their TMDB id — adding one with only the seasons asked for monitored, or monitoring
 * one it has, and the episodes asked for in it, then reading which episodes it has imported or queued and
 * monitoring any asked for since, so new episodes and seasons are fetched too.
 *
 * @param caller - How to ask Sonarr.
 * @param now - The clock, for which episodes have aired.
 * @returns The hand-off.
 */
const createSonarrHandOff = (
  caller: Pick<ArrCaller, 'read' | 'send'>,
  now: () => Date = () => new Date(),
): HandOffHandler => {
  const tvdbIdOf = async (request: MediaRequestRecord): Promise<number> => {
    if (request.tvdbId !== null) {
      return request.tvdbId;
    }

    const [found] =
      request.tmdbId === null
        ? []
        : await caller.read('/series/lookup', SonarrSeriesListSchema, {
            term: `tmdb:${request.tmdbId.toString()}`,
          });

    if (found === undefined || found.tvdbId <= 0) {
      throw new ArrAppFailure(saying('requests.arrApps.handOff.sonarrCannotFindItsTvdbId'));
    }

    return found.tvdbId;
  };

  const monitorAsked = async (
    items: readonly RequestItemRecord[],
    episodes: readonly SonarrEpisode[],
    handOff: Fulfilment,
  ) => {
    const asked = episodes.filter(
      (episode) =>
        !episode.monitored &&
        !episode.hasFile &&
        items.some(
          (item) =>
            !SETTLED.has(item.state) &&
            item.season === episode.seasonNumber &&
            item.episode === episode.episodeNumber,
        ),
    );

    if (asked.length === 0) {
      return;
    }

    await caller.send(
      'PUT',
      '/episode/monitor',
      { episodeIds: asked.map((episode) => episode.id), monitored: true },
      ArrAcknowledgementSchema,
    );

    const aired = asked.filter(
      (episode) =>
        episode.airDateUtc !== null &&
        episode.airDateUtc !== undefined &&
        new Date(episode.airDateUtc) <= now(),
    );

    if (handOff.searchesOnAdd && aired.length > 0) {
      await caller.send(
        'POST',
        '/command',
        { name: 'EpisodeSearch', episodeIds: aired.map((episode) => episode.id) },
        ArrCommandSchema,
      );
    }
  };

  return {
    place: async (request, items, handOff) => {
      const tvdbId = await tvdbIdOf(request);
      const [kept] = await caller.read('/series', SonarrSeriesListSchema, {
        tvdbId: tvdbId.toString(),
      });

      if (kept !== undefined) {
        if (!kept.monitored) {
          await caller.send(
            'PUT',
            '/series/editor',
            { seriesIds: [kept.id], monitored: true },
            ArrAcknowledgementSchema,
          );
        }

        await monitorAsked(
          items,
          await caller.read('/episode', SonarrEpisodesSchema, { seriesId: kept.id.toString() }),
          handOff,
        );

        return kept.id;
      }

      const [found] = await caller.read('/series/lookup', SonarrSeriesListSchema, {
        term: `tvdb:${tvdbId.toString()}`,
      });

      if (found === undefined) {
        throw new ArrAppFailure(saying('requests.arrApps.handOff.sonarrCannotFindItsTvdbId'));
      }

      return (
        await caller.send(
          'POST',
          '/series',
          {
            title: found.title,
            tvdbId,
            qualityProfileId: handOff.qualityProfileId,
            languageProfileId: 1,
            rootFolderPath: handOff.rootFolderPath,
            monitored: true,
            seasonFolder: true,
            seriesType: 'standard',
            seasons: found.seasons.map((season) => ({
              seasonNumber: season.seasonNumber,
              monitored: isSeasonWanted(request, season.seasonNumber),
            })),
            addOptions: {
              searchForMissingEpisodes: handOff.searchesOnAdd,
              ignoreEpisodesWithFiles: true,
              ignoreEpisodesWithoutFiles: false,
            },
          },
          ArrIdSchema,
        )
      ).id;
    },

    search: async (_request, handOffId) => {
      await caller.send(
        'POST',
        '/command',
        { name: 'SeriesSearch', seriesId: handOffId },
        ArrCommandSchema,
      );
    },

    releases: async (_request, items, handOffId) => {
      const seasons = [
        ...new Set(
          items.flatMap((item) =>
            item.season === null || item.state === 'available' || item.state === 'filed'
              ? []
              : [item.season],
          ),
        ),
      ];
      const found = await Promise.all(
        seasons.map((season) =>
          caller.read('/release', ArrReleaseSchema.array(), {
            seriesId: handOffId.toString(),
            seasonNumber: season.toString(),
          }),
        ),
      );

      return [...new Map(found.flat().map((release) => [release.guid, release])).values()];
    },

    pageOf: async (_request, handOffId) => {
      const series = await caller.read(`/series/${handOffId.toString()}`, SonarrSeriesSchema);

      return series.titleSlug === null || series.titleSlug === undefined
        ? null
        : `/series/${series.titleSlug}`;
    },

    watch: async (_request, items, handOff, handOffId, queue) => {
      const seriesId = handOffId.toString();
      const [series, episodes, files] = await Promise.all([
        caller.read(`/series/${seriesId}`, SonarrSeriesSchema),
        caller.read('/episode', SonarrEpisodesSchema, { seriesId }),
        caller.read('/episodefile', ArrFilesSchema, { seriesId }),
      ]);

      await monitorAsked(items, episodes, handOff);

      return items.map((item): ItemSighting => {
        const episode = episodes.find(
          (one) => one.seasonNumber === item.season && one.episodeNumber === item.episode,
        );
        const file =
          episode === undefined || !episode.hasFile
            ? undefined
            : files.find((one) => one.id === episode.episodeFileId);

        if (file !== undefined) {
          return {
            itemId: item.id,
            kind: 'imported',
            path: file.path,
            folder: series.path ?? dirname(dirname(file.path)),
          };
        }

        const queued =
          episode === undefined
            ? undefined
            : queue.find((record) => record.episodeId === episode.id);

        return queued === undefined
          ? { itemId: item.id, kind: 'missing' }
          : { itemId: item.id, kind: 'queued', record: queued };
      });
    },
  };
};

export { createSonarrHandOff };
