import { Check, Download, Pause, RotateCcw } from '@keyline-icons/react-native';
import { Alert } from 'react-native';
import { describeKeptListening } from '@ValenceClient/downloads/describeKeptListening';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import { standingOfKeptListening } from '@ValenceClient/downloads/standingOfKeptListening';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { waysToKeepMusic } from '@ValenceClient/downloads/waysToKeepMusic';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ARoundAction } from '@ValenceMobile/components/ARoundAction/ARoundAction';
import { showActionSheet } from '@ValenceMobile/platform/showActionSheet';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';
import type { ADownloadToListenProps } from './ADownloadToListen.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks which quality to download songs at, each with roughly how much room it takes.
 *
 * @param title - What is being downloaded.
 * @param tracks - Its songs.
 * @returns The quality chosen, or nothing where somebody cancelled.
 */
const askWhichQuality = (
  title: string,
  tracks: ADownloadToListenProps['tracks'],
): Promise<AudioQuality | null> => {
  const ways = waysToKeepMusic(tracks);

  return new Promise((settle) => {
    showActionSheet(
      {
        title: say('common.downloadTitle', { title }),
        options: [
          ...ways.map((way) =>
            [way.label, way.bytes === null ? way.detail : formatBytes(way.bytes)].join(' · '),
          ),
          say('common.cancel'),
        ],
        cancelButtonIndex: ways.length,
      },
      (picked) => {
        settle(ways[picked]?.quality ?? null);
      },
    );
  });
};

/**
 * Downloads an album, a playlist, liked songs or an audiobook to this phone to listen to offline,
 * saying how far it has got, pausing and carrying on when pressed, and asking first before taking a
 * finished one off the phone.
 *
 * @param kind - What kind of thing it downloads.
 * @param id - Which one.
 * @param title - What it is called.
 * @param tracks - Its songs, for how much room each quality takes; none for an audiobook.
 * @param toKeep - What to keep at the quality chosen.
 * @param isRound - Whether it is drawn as a round button with its words beneath, among a page's
 *   other round buttons.
 */
const ADownloadToListen = ({
  kind,
  id,
  title,
  tracks,
  toKeep,
  isRound = false,
}: ADownloadToListenProps) => {
  const shelf = useKeptListening();
  const kept = shelf.here.find((one) => one.kind === kind && one.id === id);

  if (kept === undefined) {
    const download = () => {
      void (
        kind === 'audiobook'
          ? Promise.resolve<AudioQuality>('lossless')
          : askWhichQuality(title, tracks)
      ).then(async (quality) => {
        if (quality !== null) {
          await theKeptListening().keep(keptListeningOf(toKeep(quality)));
        }
      });
    };

    return isRound ? (
      <ARoundAction icon={Download} says={say('common.download')} onPress={download} />
    ) : (
      <Button tone="quiet" icon={Download} onPress={download}>
        {say('common.download')}
      </Button>
    );
  }

  const description = describeKeptListening(
    standingOfKeptListening(shelf, kept, platformInUse().listeningFiles.canPlay),
  );

  const icon =
    description.next === 'remove' ? Check : description.next === 'pause' ? Pause : RotateCcw;
  const change = () => {
    if (description.next !== 'remove') {
      void theKeptListening().pause(kind, id, description.next === 'pause');

      return;
    }

    Alert.alert(
      say('common.removeTheDownloadOfTitle', { title }),
      say('common.itComesOffThisDevice'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.downloadItAgain'),
          onPress: () => {
            void theKeptListening().keep(keptListeningOf(toKeep(kept.quality ?? 'lossless')));
          },
        },
        {
          text: say('common.removeTheDownload'),
          style: 'destructive',
          onPress: () => {
            void theKeptListening().drop(kind, id);
          },
        },
      ],
    );
  };

  return isRound ? (
    <ARoundAction icon={icon} says={description.says} onPress={change} />
  ) : (
    <Button tone="quiet" icon={icon} onPress={change}>
      {description.says}
    </Button>
  );
};

ADownloadToListen.displayName = 'ADownloadToListen';

export { ADownloadToListen };
