import { readFile } from 'node:fs/promises';
import { parseAdvancedSubStation } from '@ValenceCore/functions/parseAdvancedSubStation';
import { toWebVtt } from '@ValenceCore/functions/toWebVtt';
import { decodeSubtitle } from '@ValenceServer/subtitles/decodeSubtitle';
import { describeSubtitleLabel } from '@ValenceServer/subtitles/describeSubtitleLabel';
import { trackId } from '@ValenceServer/subtitles/SubtitleService';
import type { SubtitleService } from '@ValenceServer/subtitles/SubtitleService';
import type { FetchedSubtitleStore } from './createFetchedSubtitleStore';

const STYLED = new Set(['ass', 'ssa']);

/**
 * The subtitles Valence fetched, as tracks a player can choose: each read from Valence's own data,
 * named by its language as any other track is, and turned into WebVTT or styled cues the same way.
 *
 * @param store - Where the fetched subtitles are kept.
 * @returns The tracks, as a source of subtitles beside the file's own.
 */
const createFetchedSubtitleService = (store: FetchedSubtitleStore): SubtitleService => {
  const find = async (mediaId: string, id: string) =>
    (await store.list(mediaId)).find((entry) => trackId(store.pathOf(mediaId, entry)) === id) ??
    null;

  const readText = async (mediaId: string, id: string) => {
    const entry = await find(mediaId, id);

    if (entry === null) {
      return null;
    }

    const bytes = await readFile(store.pathOf(mediaId, entry)).catch(() => null);

    return bytes === null ? null : { entry, text: decodeSubtitle(bytes, entry.language).text };
  };

  return {
    list: async (mediaId) =>
      (await store.list(mediaId)).map((entry) => ({
        id: trackId(store.pathOf(mediaId, entry)),
        language: entry.language,
        label: describeSubtitleLabel(entry.language, false, entry.isHearingImpaired),
        format: entry.format,
        isForced: false,
        isHearingImpaired: entry.isHearingImpaired,
        delivery: 'text' as const,
        streamIndex: null,
      })),

    read: async (mediaId, id) => {
      const read = await readText(mediaId, id);

      return read === null ? null : toWebVtt(read.text, read.entry.format);
    },

    readCues: async (mediaId, id) => {
      const read = await readText(mediaId, id);

      return read === null || !STYLED.has(read.entry.format)
        ? null
        : parseAdvancedSubStation(read.text).cues;
    },
  };
};

export { createFetchedSubtitleService };
