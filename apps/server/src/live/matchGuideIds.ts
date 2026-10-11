import type { ParsedChannel } from './ParsedChannel';

/**
 * Brings a name down to what two spellings of it share, so `BBC One HD` and `bbc one` are the same.
 *
 * @param name - The name.
 * @returns What is left to compare.
 */
const keyOf = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/gu, '')
    .replace(/\b(hd|fhd|uhd|4k|sd|tv)\b/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * An iptv-org guide id brought down to the channel it names, without the feed: `BBCOne.uk@East`
 * and `bbcone.uk` are the same channel.
 *
 * @param id - The id.
 * @returns What is left to compare.
 */
const idKeyOf = (id: string): string =>
  id
    .toLowerCase()
    .replace(/@.*$/u, '')
    .replace(/[^a-z0-9.]/gu, '');

/**
 * Gives each channel whose guide id the guide does not know the guide's own id for the same channel —
 * by the id without its feed, or else by a name with its quality and tags left out — so a playlist
 * and a guide from different places still line up. A channel that already names an id the
 * guide knows keeps it.
 *
 * @param channels - The channels.
 * @param names - The guide's channels' names, by its id for each.
 * @returns The channels, with the ids they could be given.
 */
const matchGuideIds = (
  channels: readonly ParsedChannel[],
  names: ReadonlyMap<string, readonly string[]>,
): ParsedChannel[] => {
  const byName = new Map<string, string>();
  const byId = new Map<string, string>();

  for (const [id, spellings] of names) {
    byId.set(idKeyOf(id), id);

    for (const spelling of spellings) {
      byName.set(keyOf(spelling), id);
    }
  }

  return channels.map((channel) =>
    channel.guideId !== null && names.has(channel.guideId)
      ? channel
      : {
          ...channel,
          guideId:
            (channel.guideId === null ? undefined : byId.get(idKeyOf(channel.guideId))) ??
            byName.get(keyOf(channel.name)) ??
            channel.guideId,
        },
  );
};

export { matchGuideIds };
