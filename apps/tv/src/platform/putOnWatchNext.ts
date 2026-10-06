import { requireOptionalNativeModule } from 'expo';
import { shelfEntryOf } from '@ValenceTv/platform/shelfEntryOf';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const KEPT = 10;

type WatchingEntry = ReturnType<typeof shelfEntryOf> & {
  positionSeconds: number;
  durationSeconds: number;
  watchedAt: number;
};

const shelf = requireOptionalNativeModule<{
  continueWatching?: (entries: WatchingEntry[], headers: Record<string, string>) => Promise<void>;
}>('ValenceTopShelf');

/**
 * Hands an Android TV's home screen what somebody is part-way through, for its Continue Watching
 * row: each title with its picture, how far in they are and when they last watched it, newest
 * first as the front page's row of them has it. Titles without a picture, or already finished, are
 * left off. A television whose home screen has no such row — an Apple TV, whose Top Shelf shows what
 * is new instead — is told nothing.
 *
 * @param titles - What they are part-way through, as the front page's row of them has it.
 * @param progress - How far into each title they are.
 */
const putOnWatchNext = (
  titles: readonly MediaSummary[],
  progress: ReadonlyMap<string, WatchProgress>,
): void => {
  if (shelf?.continueWatching === undefined) {
    return;
  }

  const entries = titles
    .filter((media) => media.hasBackdrop)
    .slice(0, KEPT)
    .flatMap((media) => {
      const at = progress.get(media.id);

      return at === undefined || at.isFinished
        ? []
        : [
            {
              ...shelfEntryOf(media),
              positionSeconds: at.positionSeconds,
              durationSeconds: at.durationSeconds,
              watchedAt: Date.parse(at.updatedAt),
            },
          ];
    });

  void shelf.continueWatching(entries, signedHeaders()).catch(() => undefined);
};

export { putOnWatchNext };
