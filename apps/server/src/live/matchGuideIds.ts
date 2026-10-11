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
    .replace(/\b(hd|fhd|uhd|4k|sd)\b/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * Gives each channel that names no guide id the guide's own id for a channel of the same name, so a
 * playlist and a guide from different places still line up. A channel that already names an id the
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

  for (const [id, spellings] of names) {
    for (const spelling of spellings) {
      byName.set(keyOf(spelling), id);
    }
  }

  return channels.map((channel) =>
    channel.guideId !== null && names.has(channel.guideId)
      ? channel
      : { ...channel, guideId: byName.get(keyOf(channel.name)) ?? channel.guideId },
  );
};

export { matchGuideIds };
