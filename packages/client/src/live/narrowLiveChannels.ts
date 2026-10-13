import { fuzzyScore } from '@ValenceCore/functions/fuzzyScore';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { LIVE_SHOWING } from '@ValenceClient/live/LIVE_SHOWING';
import type { LiveChannel } from '@ValenceContracts/schemas/LiveTv';

/**
 * The channels to list: every one, the favourites, those on air, or one group of them, then
 * searched loosely by name and group — `cb` finds CBBC — best matches first, with a channel whose
 * number is typed exactly put at the top. Shared by every client, so a search finds the same
 * channels everywhere.
 *
 * @param channels - Every channel, in their own order.
 * @param showing - All, favourites, on air, or the name of a group.
 * @param search - What was typed, or nothing.
 * @returns The channels to list, in the order to list them.
 */
const narrowLiveChannels = (
  channels: readonly LiveChannel[],
  showing: string,
  search: string,
): LiveChannel[] => {
  const searched = search.trim().toLowerCase();
  const narrowed = channels.filter(
    (channel) =>
      showing === LIVE_SHOWING.all ||
      (showing === LIVE_SHOWING.onAir && channel.health === 'onAir') ||
      (showing === LIVE_SHOWING.favourites
        ? channel.isFavourite
        : groupsOf(channel.group).includes(showing)),
  );

  if (searched === '') {
    return narrowed;
  }

  return narrowed
    .map((channel, at) => ({
      channel,
      at,
      score:
        channel.number === searched
          ? Number.POSITIVE_INFINITY
          : fuzzyScore(
              searched,
              `${channelTagsOf(channel.name).name} ${groupsOf(channel.group).join(' ')}`,
            ),
    }))
    .filter(
      (found): found is { channel: LiveChannel; at: number; score: number } => found.score !== null,
    )
    .sort((left, right) => right.score - left.score || left.at - right.at)
    .map((found) => found.channel);
};

export { narrowLiveChannels };
