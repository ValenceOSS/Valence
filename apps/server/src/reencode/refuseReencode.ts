import { wouldGainNothing } from '@ValenceCore/functions/wouldGainNothing';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeRefusal, ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { saying } from '@ValenceI18n/saying';

const CANNOT_CARRY_SUBTITLES = new Set(['avi', 'm2ts']);

type ReencodeConditions = {
  item: MediaItem;
  settings: ReencodeSettings;
  isAlreadyUnderWay: boolean;
  isBeingWatched: boolean;
  isFolderWritable: boolean;
  isAlreadyKept?: boolean;
  takenName?: string | null;
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
 * bother with. A copy kept beside the film is refused where the same copy is already kept, and where
 * its name belongs to a file Valence did not make, which is never written over.
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
  isAlreadyKept = false,
  takenName = null,
}: ReencodeConditions): ReencodeRefusal | null => {
  if (isAlreadyUnderWay) {
    return {
      code: 'AlreadyUnderWay',
      detail: saying('server.reencode.refuseReencode.thisOneIsAlreadyQueuedOr'),
    };
  }

  if (isBeingWatched) {
    return {
      code: 'BeingWatched',
      detail: saying('server.reencode.refuseReencode.somebodyIsWatchingThisNowReplacing'),
    };
  }

  if (!isFolderWritable) {
    return {
      code: 'FolderIsReadOnly',
      detail: saying('server.reencode.refuseReencode.valenceCannotWriteToTheFolder'),
    };
  }

  if (isAlreadyKept) {
    return {
      code: 'AlreadyKept',
      detail: saying('server.reencode.refuseReencode.thisCopyIsAlreadyKept'),
    };
  }

  if (takenName !== null) {
    return {
      code: 'NameIsTaken',
      detail: saying('server.reencode.refuseReencode.aFileOfThatNameIsAlready', {
        fileName: takenName,
      }),
    };
  }

  const keepsTheContainer = settings.mode !== 'keep' || settings.container === undefined;

  if (
    keepsTheContainer &&
    item.subtitleStreams.length > 0 &&
    CANNOT_CARRY_SUBTITLES.has(item.container.toLowerCase())
  ) {
    return {
      code: 'SubtitlesWouldNotSurvive',
      detail: saying('server.reencode.refuseReencode.thisFileCarriesSubtitlesThatA', {
        container: item.container,
      }),
    };
  }

  if (wouldGainNothing(item, settings)) {
    return {
      code: 'AlreadyAsSmall',
      detail:
        settings.mode === 'keep'
          ? saying('server.reencode.refuseReencode.thisWouldBeTheSamePicture')
          : saying('server.reencode.refuseReencode.thisFileIsAlreadyAtOr'),
    };
  }

  return null;
};

export type { ReencodeConditions };

export { refuseReencode };
