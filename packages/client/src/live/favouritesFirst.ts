import type { LiveChannel } from '@ValenceContracts/schemas/LiveTv';

/**
 * Puts the channels somebody has kept at the top, each group in the order the playlist gives it.
 *
 * @param channels - The channels, in the playlist's order.
 * @returns The favourites, then everything else.
 */
const favouritesFirst = (channels: readonly LiveChannel[]): LiveChannel[] => [
  ...channels.filter((channel) => channel.isFavourite),
  ...channels.filter((channel) => !channel.isFavourite),
];

export { favouritesFirst };
