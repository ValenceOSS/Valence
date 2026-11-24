import { KBPS_IN_A_MBPS } from '@ValenceCore/tokens/KBPS_IN_A_MBPS';
import type { TypedStreamLimit } from '@ValenceScreens/components/AdminArea/components/StreamLimitCard/StreamLimitCard.types';

/**
 * Reads one field as a whole number above nothing, or as no limit at all where it was left empty.
 *
 * @param typed - What was typed.
 * @param scale - What a typed unit is worth in the stored one.
 * @returns The limit, null for none, or undefined where what was typed is not a limit.
 */
const limitOf = (typed: string, scale: number): number | null | undefined => {
  if (typed.trim() === '') {
    return null;
  }

  const read = Math.round(Number(typed) * scale);

  return Number.isFinite(read) && read > 0 ? read : undefined;
};

/**
 * Reads what was typed into a limit's fields, the bitrate from megabits, each number as a limit, as
 * no limit where left empty, or as undefined where what was typed is not a limit, with the quality as
 * chosen and downloads held to it only where there is a quality to hold them to.
 *
 * @param typed - What each field holds.
 * @returns Each side of the limit as read.
 */
const readTypedStreamLimit = (typed: TypedStreamLimit) => ({
  maxBitrateKbps: limitOf(typed.bitrate, KBPS_IN_A_MBPS),
  maxStreams: limitOf(typed.streams, 1),
  maxQuality: typed.quality,
  limitsDownloads: typed.quality !== null && typed.limitsDownloads,
});

export { readTypedStreamLimit };
