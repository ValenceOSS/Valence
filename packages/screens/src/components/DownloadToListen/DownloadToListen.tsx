import { CircleArrowDown as CircleArrowDownIcon } from '@keyline-icons/react';
import { CircleArrowDown as CircleArrowDownFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Icon } from '@ValenceUI/Icon';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { describeKeptListening } from '@ValenceClient/downloads/describeKeptListening';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import { standingOfKeptListening } from '@ValenceClient/downloads/standingOfKeptListening';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { waysToKeepMusic } from '@ValenceClient/downloads/waysToKeepMusic';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';
import type { DownloadToListenProps } from './DownloadToListen.types';
import { say } from '@ValenceI18n/say';

/**
 * Downloads an album, a playlist, liked songs or an audiobook to this device to listen to offline,
 * choosing the quality first for music, and once begun saying how far it has got, with a way to
 * pause, carry on, fetch it again or take it off. Drawn only where this client can keep files.
 *
 * @param kind - What kind of thing it downloads.
 * @param id - Which one.
 * @param title - What it is called.
 * @param tracks - Its songs, for how much room each quality takes; none for an audiobook.
 * @param toKeep - What to keep at the quality chosen.
 */
const DownloadToListen = ({ kind, id, title, tracks, toKeep }: DownloadToListenProps) => {
  const shelf = useKeptListening();

  if (!canKeepFiles()) {
    return null;
  }

  const keep = (quality: AudioQuality) => {
    void theKeptListening().keep(keptListeningOf(toKeep(quality)));
  };
  const kept = shelf.here.find((one) => one.kind === kind && one.id === id);

  if (kept === undefined) {
    return (
      <ActionMenu
        label={say('common.downloadTitle', { title })}
        trigger={<Icon of={CircleArrowDownIcon} size={22} />}
        groups={[
          {
            name: say('common.download'),
            items:
              kind === 'audiobook'
                ? [
                    {
                      id: 'audiobook',
                      label: say('common.download'),
                      onChoose: () => {
                        keep('lossless');
                      },
                    },
                  ]
                : waysToKeepMusic(tracks).map((way) => ({
                    id: way.quality,
                    label: way.label,
                    detail: way.bytes === null ? way.detail : formatBytes(way.bytes),
                    onChoose: () => {
                      keep(way.quality);
                    },
                  })),
          },
        ]}
      />
    );
  }

  const description = describeKeptListening(
    standingOfKeptListening(shelf, kept, platformInUse().listeningFiles.canPlay),
  );

  return (
    <ActionMenu
      label={description.says}
      trigger={
        <Icon
          of={CircleArrowDownFilledIcon}
          size={22}
          tone={description.next === 'remove' ? 'strong' : 'muted'}
        />
      }
      groups={[
        {
          name: description.says,
          items: [
            ...(description.next === 'remove'
              ? []
              : [
                  {
                    id: 'pause',
                    label:
                      description.next === 'pause'
                        ? say('common.pauseTitle', { title })
                        : say('common.carryOnFetchingTitle', { title }),
                    onChoose: () => {
                      void theKeptListening().pause(kind, id, description.next === 'pause');
                    },
                  },
                ]),
            {
              id: 'again',
              label: say('common.downloadItAgain'),
              onChoose: () => {
                keep(kept.quality ?? 'lossless');
              },
            },
            {
              id: 'remove',
              label: say('common.removeTheDownload'),
              isDestructive: true,
              onChoose: () => {
                void theKeptListening().drop(kind, id);
              },
            },
          ],
        },
      ]}
    />
  );
};

DownloadToListen.displayName = 'DownloadToListen';

export { DownloadToListen };
