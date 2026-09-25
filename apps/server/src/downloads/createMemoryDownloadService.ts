import { randomUUID } from 'node:crypto';
import { theEpisodesAskedFor } from './theEpisodesAskedFor';
import type { Download, DownloadQuality, Holding } from '@ValenceContracts/schemas/Download';
import type { DownloadOffer, DownloadService } from './DownloadService';

type MemoryState = {
  downloads: Record<string, Download[]>;
  holdings: Record<string, Holding[]>;
  offers: Record<string, DownloadOffer>;
  episodes: Record<string, string[]>;
};

/**
 * Downloads held in memory, so the routes can be exercised without Postgres or a media service.
 *
 * @param state - Anything already asked for.
 * @returns The download service.
 */
const createMemoryDownloadService = (
  state: MemoryState = { downloads: {}, holdings: {}, offers: {}, episodes: {} },
): DownloadService & { state: MemoryState } => {
  const memory: DownloadService & { state: MemoryState } = {
    state,

    offer: (mediaId) => Promise.resolve(state.offers[mediaId] ?? null),

    offerSeries: (seriesId, _deviceProfile, mediaIds) => {
      const first = theEpisodesAskedFor(
        (state.episodes[seriesId] ?? []).map((id) => ({ id })),
        mediaIds,
      )[0]?.id;

      return Promise.resolve(first === undefined ? null : (state.offers[first] ?? null));
    },

    ask: (profileId, clientId, mediaId, quality, audioLanguages) => {
      const asked = state.downloads[profileId] ?? [];
      const already = asked.find((one) => one.mediaId === mediaId && one.quality === quality);

      if (already !== undefined) {
        return Promise.resolve(already);
      }

      const made: Download = {
        id: randomUUID(),
        mediaId,
        seriesId: null,
        seriesTitle: null,
        title: mediaId,
        quality,
        audioLanguages,
        state: 'preparing',
        progress: 0,
        bytesPerSecond: null,
        sizeBytes: null,
        failure: null,
        askedFrom: clientId,
        askedAt: new Date(0).toISOString(),
        readyAt: null,
      };

      state.downloads[profileId] = [made, ...asked];

      return Promise.resolve(made);
    },

    askForSeries: (profileId, clientId, seriesId, quality, audioLanguages, mediaIds) =>
      Promise.all(
        theEpisodesAskedFor(
          (state.episodes[seriesId] ?? []).map((id) => ({ id })),
          mediaIds,
        ).map(async ({ id }) => memory.ask(profileId, clientId, id, quality, audioLanguages)),
      ).then((asked) => asked.filter((one) => one !== null)),

    pause: (profileId, id) => {
      state.downloads[profileId] = (state.downloads[profileId] ?? []).map((one) =>
        one.id === id && one.state !== 'ready' ? { ...one, state: 'paused' } : one,
      );

      return Promise.resolve();
    },

    resume: (profileId, id) => {
      state.downloads[profileId] = (state.downloads[profileId] ?? []).map((one) =>
        one.id === id && one.state === 'paused' ? { ...one, state: 'queued' } : one,
      );

      return Promise.resolve();
    },

    list: (profileId) => Promise.resolve(state.downloads[profileId] ?? []),

    follow: () => Promise.resolve([]),

    readFile: (profileId, id) => {
      const ready = (state.downloads[profileId] ?? []).find(
        (one) => one.id === id && one.state === 'ready',
      );

      return Promise.resolve(
        ready === undefined
          ? null
          : {
              file: {
                body: new Blob([`the film ${ready.mediaId}`]).stream(),
                contentType: 'video/mp4',
                status: 200,
                contentRange: null,
                contentLength: null,
              },
              title: ready.title,
            },
      );
    },

    forget: (profileId, id) => {
      state.downloads[profileId] = (state.downloads[profileId] ?? []).filter(
        (one) => one.id !== id,
      );

      return Promise.resolve();
    },

    hold: (profileId, _clientId, mediaId, quality) => {
      const held = state.holdings[profileId] ?? [];

      if (!held.some((one) => one.mediaId === mediaId && one.quality === quality)) {
        state.holdings[profileId] = [
          { mediaId, quality, heldAt: new Date(0).toISOString() },
          ...held,
        ];
      }

      return Promise.resolve();
    },

    release: (profileId: string, _clientId: string, mediaId: string, quality: DownloadQuality) => {
      state.holdings[profileId] = (state.holdings[profileId] ?? []).filter(
        (one) => !(one.mediaId === mediaId && one.quality === quality),
      );

      return Promise.resolve();
    },

    held: (profileId) => Promise.resolve(state.holdings[profileId] ?? []),
  };

  return memory;
};

export type { MemoryState };

export { createMemoryDownloadService };
