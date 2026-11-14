import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { ticksOf } from '@ValenceServer/jellyfin/ticksOf';
import type { JellyfinUserData } from '@ValenceServer/jellyfin/JellyfinDtos';
import type { JellyfinViewing } from '@ValenceServer/jellyfin/JellyfinViewing';

const WHOLE = 100;

/**
 * What a Jellyfin app is told about a viewer and one item: how far they got, whether they have
 * watched it, and whether they keep it as a favourite, from the profile's own progress.
 *
 * @param mediaId - The item.
 * @param viewing - The profile's progress and favourites.
 * @returns The viewer's data for it.
 */
const jellyfinUserDataOf = (mediaId: string, viewing: JellyfinViewing): JellyfinUserData => {
  const id = jellyfinIdOf(mediaId);
  const got = viewing.progress.get(mediaId);
  const isFavorite = viewing.favourites.has(mediaId);

  if (got === undefined) {
    return {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      IsFavorite: isFavorite,
      Played: false,
      Key: id,
      ItemId: id,
    };
  }

  return {
    PlaybackPositionTicks: got.isFinished ? 0 : ticksOf(got.positionSeconds),
    PlayCount: got.isFinished ? 1 : 0,
    IsFavorite: isFavorite,
    Played: got.isFinished,
    Key: id,
    ItemId: id,
    LastPlayedDate: got.updatedAt,
    ...(got.isFinished
      ? {}
      : { PlayedPercentage: Math.min(WHOLE, (got.positionSeconds / got.durationSeconds) * WHOLE) }),
  };
};

export { jellyfinUserDataOf };
