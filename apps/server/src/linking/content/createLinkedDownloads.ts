import type { DownloadOffer, DownloadService } from '@ValenceServer/downloads/DownloadService';
import type { LinkedTitle } from './createLinkedPlayback';

type MayKeep = 'here' | 'original' | 'not';

/**
 * Keeps to the original copies an offer makes of something from a linked server.
 *
 * @param offered - The offer, or nothing.
 * @param may - What may be kept.
 * @returns The offer.
 */
const offeringOnly = (offered: DownloadOffer | null, may: MayKeep): DownloadOffer | null =>
  offered === null || may === 'here'
    ? offered
    : { ...offered, options: offered.options.filter((option) => option.quality === 'original') };

/**
 * Downloads that keep a linked title, or a linked programme's episodes, only where the server that
 * has it lets this one's people keep its titles, and then only as its original — the one copy that
 * is the other server's file as it is, rather than something this server would have to make from a
 * file it does not have.
 *
 * @param local - This server's downloads, made over `linkedRenditions`.
 * @param linkedTitleOf - Which linked server a title is from, or nothing where it is this one's.
 * @param linkedServerOfSeries - Which linked server a programme is from, or nothing.
 * @param allowsDownloads - Whether a linked server lets this one's people keep its titles.
 * @returns The downloads.
 */
const createLinkedDownloads = (
  local: DownloadService,
  linkedTitleOf: (mediaId: string) => Promise<LinkedTitle | null>,
  linkedServerOfSeries: (seriesId: string) => Promise<string | null>,
  allowsDownloads: (serverId: string) => boolean,
): DownloadService => {
  const mayKeepFrom = (serverId: string | null): MayKeep =>
    serverId === null ? 'here' : allowsDownloads(serverId) ? 'original' : 'not';
  const mayKeep = async (mediaId: string) =>
    mayKeepFrom((await linkedTitleOf(mediaId))?.serverId ?? null);

  return {
    ...local,

    offer: async (mediaId, deviceProfile) => {
      const may = await mayKeep(mediaId);

      return may === 'not' ? null : offeringOnly(await local.offer(mediaId, deviceProfile), may);
    },

    offerSeries: async (seriesId, deviceProfile, mediaIds) => {
      const may = mayKeepFrom(await linkedServerOfSeries(seriesId));

      return may === 'not'
        ? null
        : offeringOnly(await local.offerSeries(seriesId, deviceProfile, mediaIds), may);
    },

    ask: async (profileId, clientId, mediaId, quality, audioLanguages) => {
      const may = await mayKeep(mediaId);

      return may === 'not' || (may === 'original' && quality !== 'original')
        ? null
        : local.ask(profileId, clientId, mediaId, quality, audioLanguages);
    },

    askForSeries: async (profileId, clientId, seriesId, quality, audioLanguages, mediaIds) => {
      const may = mayKeepFrom(await linkedServerOfSeries(seriesId));

      return may === 'not' || (may === 'original' && quality !== 'original')
        ? []
        : local.askForSeries(profileId, clientId, seriesId, quality, audioLanguages, mediaIds);
    },
  };
};

export { createLinkedDownloads };
