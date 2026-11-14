import { WatchProgressSchema } from '@ValenceContracts/schemas/WatchProgress';
import { secondsOfJellyfinTicks } from '@ValenceClient/jellyfin/secondsOfJellyfinTicks';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { JellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * How far somebody got in an item on a Jellyfin server, as Valence keeps it, where they started it
 * or finished it.
 *
 * @param item - The item, with its user data.
 * @param book - How identifiers are turned.
 * @returns Their progress, or nothing where they never started it.
 */
const progressOfJellyfinItem = (item: JellyfinItem, book: JellyfinIdBook): WatchProgress | null => {
  const data = item.UserData;
  const position = secondsOfJellyfinTicks(data?.PlaybackPositionTicks);
  const isFinished = data?.Played === true;

  if (data === null || data === undefined || (!isFinished && position <= 0)) {
    return null;
  }

  const played = new Date(data.LastPlayedDate ?? item.DateCreated ?? 0);

  return WatchProgressSchema.parse({
    mediaId: book.valenceIdOf(item.Id),
    positionSeconds: position,
    durationSeconds: Math.max(1, secondsOfJellyfinTicks(item.RunTimeTicks)),
    isFinished,
    updatedAt: (Number.isNaN(played.getTime()) ? new Date(0) : played).toISOString(),
  });
};

export { progressOfJellyfinItem };
