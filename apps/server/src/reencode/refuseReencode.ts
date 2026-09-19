import { wouldGainNothing } from '@ValenceCore/functions/wouldGainNothing';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeRefusal, ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const CANNOT_CARRY_SUBTITLES = new Set(['avi', 'm2ts']);

type ReencodeConditions = {
  item: MediaItem;
  settings: ReencodeSettings;
  isAlreadyUnderWay: boolean;
  isBeingWatched: boolean;
  isFolderWritable: boolean;
};

/**
 * Why this file cannot be re-encoded on these settings, where it cannot.
 *
 * Every one of these is asked before anything starts, which is the point of asking at all. An
 * operator who queues twenty files on a Friday should be told on Friday which of them will not work
 * — not find on Monday that three of them stopped two hours in, having held a card and a disk for
 * nothing.
 *
 * Ordered most decisive first, so the reason somebody is given is the one they would act on. A file
 * already being worked on is not also read-only; a file nobody can write is not also too small to
 * bother with.
 *
 * Whether there is room, and whether too many encodes are already waiting to be judged, are
 * deliberately not here. Both are facts about the whole queue rather than about this file, and
 * repeating them against every row in a batch of twenty says the same thing twenty times.
 *
 * @param conditions - The file, what was chosen, and what is true of it right now.
 * @returns Why not, or nothing where it can go ahead.
 */
const refuseReencode = ({
  item,
  settings,
  isAlreadyUnderWay,
  isBeingWatched,
  isFolderWritable,
}: ReencodeConditions): ReencodeRefusal | null => {
  if (isAlreadyUnderWay) {
    return {
      code: 'AlreadyUnderWay',
      detail: 'This one is already queued or being worked on.',
    };
  }

  if (isBeingWatched) {
    return {
      code: 'BeingWatched',
      detail: 'Somebody is watching this now. Replacing a file underneath a stream would end it.',
    };
  }

  if (!isFolderWritable) {
    return {
      code: 'FolderIsReadOnly',
      detail:
        'Valence cannot write to the folder this file is in. Media is usually mounted read only, which is sensible and means this cannot work until it is mounted read and write.',
    };
  }

  if (
    item.subtitleStreams.length > 0 &&
    CANNOT_CARRY_SUBTITLES.has(item.container.toLowerCase())
  ) {
    return {
      code: 'SubtitlesWouldNotSurvive',
      detail: `This file carries subtitles that a ${item.container} file cannot hold, and the container is never changed. Re-encoding it would lose them.`,
    };
  }

  if (wouldGainNothing(item, settings)) {
    return {
      code: 'AlreadyAsSmall',
      detail:
        settings.mode === 'keep'
          ? 'This would be the same picture in the same codec as the file itself, so it would be a second copy of what is already there.'
          : 'This file is already at or below what was chosen, so re-encoding it would throw away a generation of quality and save nothing.',
    };
  }

  return null;
};

export type { ReencodeConditions };

export { CANNOT_CARRY_SUBTITLES, refuseReencode };
