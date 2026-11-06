import { sayAgain } from '@ValenceI18n/sayAgain';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';
import { say } from '@ValenceI18n/say';

/**
 * Says why a video is not in the library, for the folder view's details pane: what the last scan
 * said of it where it said something, or else what keeps it out.
 *
 * @param entry - The file.
 * @returns Why, or nothing where it is in the library or is not a video kept out of it.
 */
const reasonOfEntry = (entry: LibraryEntry): string | null => {
  if (entry.reason !== null && entry.reason !== undefined) {
    return sayAgain(entry.reason);
  }

  switch (entry.status) {
    case 'leftOut':
      return say('screens.adminArea.folderView.excludedFromTheLibrary');
    case 'sample':
      return say('screens.adminArea.folderView.looksLikeASample');
    case 'skipped':
      return say('screens.adminArea.folderView.inAFolderScansSkip');
    case 'notReadYet':
      return say('screens.adminArea.folderView.theLibraryHasNotReadItYet');
    case 'inLibrary':
    case 'unmatched':
    case 'extra':
    case 'unreadable':
    case 'sidecar':
    case 'orphaned':
    case 'notAVideo':
    case null:
    case undefined:
      return null;
  }
};

export { reasonOfEntry };
