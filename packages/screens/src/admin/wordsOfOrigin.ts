import type { MediaOrigin } from '@ValenceContracts/schemas/MediaOrigin';
import { say } from '@ValenceI18n/say';

/**
 * Says in a few words where a library file came from, and that it is linked to a download where it
 * shares its data with one still on the disk, naming the download client or app where it is known.
 *
 * @param origin - Where it came from.
 * @returns What to say.
 */
const wordsOfOrigin = ({ source, via, link }: MediaOrigin): string => {
  const isLinked = link === 'linked';

  switch (source) {
    case 'download':
    case 'handOff':
      if (isLinked) {
        return via === null
          ? say('screens.admin.wordsOfOrigin.linkedToADownload')
          : say('screens.admin.wordsOfOrigin.linkedToADownloadVia', { client: via });
      }

      if (source === 'handOff') {
        return via === null
          ? say('screens.admin.wordsOfOrigin.fetchedByAConnectedApp')
          : say('screens.admin.wordsOfOrigin.fetchedByApp', { app: via });
      }

      return via === null
        ? say('common.downloaded')
        : say('screens.admin.wordsOfOrigin.downloadedVia', { client: via });
    case 'upload':
      return say('screens.admin.wordsOfOrigin.uploaded');
    case 'import':
      return via === null
        ? say('screens.admin.wordsOfOrigin.imported')
        : say('screens.admin.wordsOfOrigin.importedFrom', { source: via });
    case 'disk':
      return isLinked
        ? say('screens.admin.wordsOfOrigin.foundOnDiskLinked')
        : say('screens.admin.wordsOfOrigin.foundOnDisk');
  }
};

export { wordsOfOrigin };
