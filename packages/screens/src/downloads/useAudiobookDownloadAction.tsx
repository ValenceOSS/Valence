import { CircleArrowDown as CircleArrowDownIcon } from '@keyline-icons/react';
import { CircleArrowDown as CircleArrowDownFilledIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { describeKeptListening } from '@ValenceClient/downloads/describeKeptListening';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import { standingOfKeptListening } from '@ValenceClient/downloads/standingOfKeptListening';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { ActionBarAction } from '@ValenceUI/ActionBar.types';
import type { BookDetail } from '@ValenceContracts/schemas/Book';
import { say } from '@ValenceI18n/say';

/**
 * The action that downloads an audiobook to this device to listen to offline, and once begun says
 * how far it has got, pausing, carrying on, fetching it again or taking it off.
 *
 * @param detail - The book, where it has been read and can be heard.
 * @returns The action, or nothing where this client keeps no files or the book cannot be heard.
 */
const useAudiobookDownloadAction = (detail: BookDetail | null): ActionBarAction | null => {
  const shelf = useKeptListening();

  if (detail === null || detail.book.hasAudio !== true || !canKeepFiles()) {
    return null;
  }

  const { book } = detail;
  const keep = () => {
    void theKeptListening().keep(keptListeningOf({ kind: 'audiobook', detail }));
  };
  const kept = shelf.here.find((one) => one.kind === 'audiobook' && one.id === book.id);

  if (kept === undefined) {
    return {
      id: 'download',
      label: say('common.download'),
      icon: <Icon of={CircleArrowDownIcon} size={18} />,
      onChoose: keep,
    };
  }

  const description = describeKeptListening(
    standingOfKeptListening(shelf, kept, platformInUse().listeningFiles.canPlay),
  );

  return {
    id: 'download',
    label: description.says,
    icon: <Icon of={CircleArrowDownFilledIcon} size={18} />,
    onChoose: () => {},
    choices: [
      ...(description.next === 'remove'
        ? []
        : [
            {
              id: 'pause',
              label:
                description.next === 'pause'
                  ? say('common.pauseTitle', { title: book.title })
                  : say('common.carryOnFetchingTitle', { title: book.title }),
              onChoose: () => {
                void theKeptListening().pause('audiobook', book.id, description.next === 'pause');
              },
            },
          ]),
      { id: 'again', label: say('common.downloadItAgain'), onChoose: keep },
      {
        id: 'remove',
        label: say('common.removeTheDownload'),
        onChoose: () => {
          void theKeptListening().drop('audiobook', book.id);
        },
      },
    ],
  };
};

export { useAudiobookDownloadAction };
