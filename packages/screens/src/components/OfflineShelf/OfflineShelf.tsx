import { useState } from 'react';
import {
  Bin as BinIcon,
  CloudOff as CloudOffIcon,
  MoreHorizontal as EllipsisIcon,
} from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Icon } from '@ValenceUI/Icon';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { describeKeeping, keptFraction } from '@ValenceCore/functions/describeKeeping';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { posterForAFile } from '@ValenceClient/downloads/keepingFiles';
import { watchedOffline } from '@ValenceClient/offline/watchedOffline';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { OfflineShelfProps } from './OfflineShelf.types';

const MEANINGFUL = 0.01;

/**
 * Gathers what is on the disk under the programme each thing belongs to.
 *
 * A season fetched in one press is one thing somebody did, and reading it as thirteen unrelated rows
 * makes it impossible to see at a glance whether the whole thing is here — which is the only
 * question worth asking of a shelf somebody is about to fly with.
 *
 * @param held - Everything on this device.
 * @returns The groups, films first and under no title, then each programme.
 */
const byProgramme = (held: HeldFile[]): { title: string | null; items: HeldFile[] }[] => {
  const groups = new Map<string, HeldFile[]>();

  for (const file of held) {
    const under = file.seriesTitle ?? '';

    groups.set(under, [...(groups.get(under) ?? []), file]);
  }

  return [...groups.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([title, items]) => ({ title: title === '' ? null : title, items }));
};

/**
 * What is actually on this machine, which offline is the whole of.
 *
 * Everything here can be played with nothing switched on, and that is the only promise the screen
 * makes. Something still arriving is shown arriving rather than hidden, because somebody who closed
 * the lid halfway through a transfer is owed the sight of where it got to — and because a shelf that
 * silently omitted it would look like the download had been lost.
 *
 * @param held - Everything on this device.
 * @param onWatch - Told which one to play.
 * @param onDrop - Told to let go of one.
 * @param onPause - Told to stop a transfer for now, or to carry on with it.
 */
const OfflineShelf = ({ held, onWatch, onDrop, onPause }: OfflineShelfProps) => {
  const [deleting, setDeleting] = useState<HeldFile | null>(null);

  if (held.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <Icon of={CloudOffIcon} size={32} tone="muted" />

        <h2 className="font-body text-base text-text">Nothing is on this device</h2>

        <p className="max-w-sm font-body text-sm text-text-muted">
          Downloads are fetched here while Valence is reachable. Once the server is back, ask for
          something from its page and it will be waiting the next time you are offline.
        </p>
      </div>
    );
  }

  const gotTo = new Map(watchedOffline().map((entry) => [entry.mediaId, entry]));

  return (
    <div className="flex flex-col gap-10">
      {byProgramme(held).map((group) => (
        <Rail
          key={group.title ?? 'films'}
          title={group.title ?? 'Films'}
          sizesCards
          cards="portrait"
          className="-mx-4 sm:-mx-6"
          {...(group.title === null
            ? {}
            : {
                action: (
                  <span className="font-body text-xs text-text-muted">
                    {group.items.filter((one) => one.state === 'here').length.toString()} of{' '}
                    {group.items.length.toString()} here
                  </span>
                ),
              })}
        >
          {group.items.map((file, at) => {
            const watched = gotTo.get(file.mediaId);
            const fraction =
              watched === undefined || watched.durationSeconds <= 0
                ? 0
                : watched.positionSeconds / watched.durationSeconds;

            return (
              <RevealItem
                key={file.downloadId}
                index={at}
                className="group relative shrink-0 snap-start"
              >
                <MediaCard
                  shape="poster"
                  title={file.title}
                  subtitle={
                    file.state === 'here'
                      ? `${file.quality === 'original' ? 'Original' : file.quality} · ${formatBytes(file.bytes)}`
                      : describeKeeping(file)
                  }
                  {...(file.hasPoster ? { imageUrl: posterForAFile(file.downloadId) } : {})}
                  {...(fraction < MEANINGFUL ? {} : { watchedFraction: fraction })}
                  onSelect={() => {
                    if (file.state === 'here') {
                      onWatch(file);
                    }
                  }}
                />

                {file.state !== 'fetching' ? null : (
                  <ProgressBar
                    value={keptFraction(file) ?? 0}
                    max={1}
                    label={`Fetching ${file.title}`}
                    className="mt-2"
                  />
                )}

                <ActionMenu
                  label={`More for ${file.title}`}
                  align="end"
                  size="sm"
                  look="raised"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                  trigger={<Icon of={EllipsisIcon} size={16} />}
                  groups={[
                    {
                      items: [
                        ...(file.state === 'fetching' || file.state === 'paused'
                          ? [
                              {
                                id: 'pause',
                                label:
                                  file.state === 'paused'
                                    ? 'Carry on fetching'
                                    : 'Stop fetching for now',
                                icon: (
                                  <Icon
                                    of={file.state === 'paused' ? PlayFilledIcon : PauseFilledIcon}
                                    size={16}
                                  />
                                ),
                                onChoose: () => {
                                  onPause(file, file.state !== 'paused');
                                },
                              },
                            ]
                          : []),
                        {
                          id: 'delete',
                          label: 'Delete from this device',
                          icon: <Icon of={BinIcon} size={16} />,
                          isDestructive: true,
                          onChoose: () => {
                            setDeleting(file);
                          },
                        },
                      ],
                    },
                  ]}
                />
              </RevealItem>
            );
          })}
        </Rail>
      ))}

      <ConfirmDialog
        title={deleting === null ? 'Delete it?' : `Delete ${deleting.title}?`}
        detail="It is removed from this device. You can download it again once Valence is reachable."
        confirmLabel="Delete"
        isDestructive
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting !== null) {
            onDrop(deleting);
          }

          setDeleting(null);
        }}
      />
    </div>
  );
};

OfflineShelf.displayName = 'OfflineShelf';

export { OfflineShelf, byProgramme };
