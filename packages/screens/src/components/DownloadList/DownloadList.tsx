import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@ValenceUI/Icon';
import { Bell as BellIcon, Bin as BinIcon, Download as DownloadIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeTimeToGo } from '@ValenceCore/functions/describeTimeToGo';
import { forgetDownload, setDownloadPaused } from '@ValenceClient/downloads/fetchDownloads';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { canKeepFiles } from '@ValenceClient/downloads/canKeepFiles';
import { dropAFile } from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { describeKeeping } from '@ValenceCore/functions/describeKeeping';
import { KeepingControls } from '@ValenceScreens/components/DownloadList/components/KeepingControls/KeepingControls';
import type { Download } from '@ValenceContracts/schemas/Download';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says where a prepared file has got to, in the words somebody would use about it.
 *
 * @param download - The download.
 * @param isKeepable - Whether this client keeps files, or only shows them as a browser does.
 * @returns The line beneath its title.
 */
const describeState = (download: Download, isKeepable: boolean): string => {
  const done = `${Math.round(download.progress * 100).toString()}%`;

  if (download.state === 'failed') {
    return download.failure ?? say('screens.downloadList.failed');
  }

  if (download.state === 'queued') {
    return download.progress > 0
      ? say('screens.downloadList.waitingFrom', { done })
      : say('screens.downloadList.waiting');
  }

  if (download.state === 'paused') {
    return say('screens.downloadList.paused', { done });
  }

  if (download.state === 'preparing') {
    const said = [
      say('screens.downloadList.done', { done }),
      ...(download.bytesPerSecond === null
        ? []
        : [say('screens.downloadList.rate', { rate: formatBytes(download.bytesPerSecond) })]),
      ...(download.secondsLeft === null ? [] : [describeTimeToGo(download.secondsLeft)]),
    ];

    return say('screens.downloadList.preparing', { details: said.join(' · ') });
  }

  if (download.sizeBytes === null) {
    return isKeepable
      ? say('screens.downloadList.readyToKeep')
      : say('screens.downloadList.readyElsewhere');
  }

  const size = formatBytes(download.sizeBytes);

  return isKeepable
    ? say('screens.downloadList.readyToKeepSized', { size })
    : say('screens.downloadList.readyElsewhereSized', { size });
};

/**
 * What to say beneath a title, given that two different things may be happening to it.
 *
 * Once a copy is on its way to this machine, that is the wait somebody is actually watching, so it
 * is what the row describes. The server having finished its half an hour ago is no longer the
 * interesting fact — and showing both would be two progress bars for one film.
 *
 * @param download - What the server prepared.
 * @param held - The copy on this machine, where there is one.
 * @param isKeepable - Whether this client keeps files, or saves them as a browser does.
 * @returns The line beneath the title.
 */
const describeRow = (download: Download, held: HeldFile | null, isKeepable: boolean): string =>
  held === null ? describeState(download, isKeepable) : describeKeeping(held);

/**
 * Gathers downloads under the programme they belong to, in the order they were asked for.
 *
 * A season queued in one press is one thing somebody did, and reading it as thirteen unrelated rows
 * makes it impossible to see whether the season is nearly done or has barely started.
 *
 * @param downloads - Everything asked for.
 * @returns The groups, each with what to call it.
 */
const groupBySeries = (downloads: Download[]): { title: string | null; items: Download[] }[] => {
  const groups: { title: string | null; items: Download[] }[] = [];

  for (const download of downloads) {
    const title = download.seriesTitle;
    const last = groups.at(-1);

    if (last !== undefined && last.title === title && title !== null) {
      last.items.push(download);

      continue;
    }

    groups.push({ title, items: [download] });
  }

  return groups;
};

/**
 * Everything this viewer has asked the server to prepare, and what became of each.
 *
 * This is the server's side of a download and never the device's. Forgetting one here reclaims the
 * disk the server was holding in case somebody asked again; anything already on a phone stays there
 * until whoever owns the phone deletes it. Valence is not a subscription and has no business taking
 * things back.
 */
const DownloadList = () => {
  const cache = useQueryClient();
  const asked = useQuery(downloadQueries.all());
  const [deleting, setDeleting] = useState<Download | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const held = useHeldFiles();

  const downloads = asked.data ?? [];
  const onThisDevice = new Map(held.map((file) => [file.downloadId, file]));
  const isKeepable = canKeepFiles();

  if (asked.isError) {
    return (
      <div className="px-5 py-4">
        <CouldNotRead
          what={say('screens.downloadList.yours')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <p className="flex items-center gap-2 px-5 py-6 font-body text-sm text-text-muted">
        <Icon of={DownloadIcon} size={18} />
        {say('screens.downloadList.empty')}
      </p>
    );
  }

  const deletingHere = deleting !== null && onThisDevice.has(deleting.id);

  const deleteIt = (download: Download) => {
    setIsDeleting(true);

    void (onThisDevice.has(download.id) ? dropAFile(download.id) : Promise.resolve())
      .then(async () => forgetDownload(download.id))
      .then(async () => cache.invalidateQueries({ queryKey: downloadQueries.key }))
      .finally(() => {
        setIsDeleting(false);
        setDeleting(null);
      });
  };

  const isAnyPreparing = downloads.some(
    (download) => download.state === 'queued' || download.state === 'preparing',
  );

  return (
    <div className="flex flex-col">
      {isAnyPreparing ? (
        <p className="flex items-start gap-2 px-5 pt-4 font-body text-sm text-text-muted">
          <Icon of={BellIcon} size={16} className="mt-0.5 shrink-0" />
          {isKeepable
            ? say('screens.downloadList.preparingHere')
            : say('screens.downloadList.preparingElsewhere')}
        </p>
      ) : null}

      {groupBySeries(downloads).map((group) => (
        <section key={group.title ?? group.items[0]?.id} className="flex flex-col">
          {group.title === null ? null : (
            <header className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-5">
              <h3 className="text-xs uppercase tracking-[0.16em] text-text-muted">{group.title}</h3>

              <span className="font-body text-xs text-text-muted">
                {sayCount('screens.downloadList.readyOf', group.items.length, {
                  ready: group.items.filter((one) => one.state === 'ready').length,
                })}
              </span>
            </header>
          )}

          <SettingList>
            {group.items.map((download) => (
              <SettingRow
                key={download.id}
                title={download.title}
                description={describeRow(
                  download,
                  onThisDevice.get(download.id) ?? null,
                  isKeepable,
                )}
              >
                <Badge size="sm" tone={download.state === 'failed' ? 'danger' : 'quiet'}>
                  {download.quality}
                </Badge>

                {download.state !== 'preparing' ? null : (
                  <ProgressBar
                    value={download.progress}
                    max={1}
                    label={say('screens.downloadList.preparingLabel', { title: download.title })}
                    className="w-28"
                  />
                )}

                {download.state !== 'ready' || !isKeepable ? null : (
                  <KeepingControls
                    download={download}
                    held={onThisDevice.get(download.id) ?? null}
                  />
                )}

                {download.state === 'ready' || download.state === 'failed' ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    label={
                      download.state === 'paused'
                        ? say('screens.downloadList.resume', { title: download.title })
                        : say('screens.downloadList.pause', { title: download.title })
                    }
                    onClick={() => {
                      void setDownloadPaused(download.id, download.state !== 'paused').then(
                        async () => cache.invalidateQueries({ queryKey: downloadQueries.key }),
                      );
                    }}
                  >
                    {download.state === 'paused' ? (
                      <Icon of={PlayFilledIcon} size={16} />
                    ) : (
                      <Icon of={PauseFilledIcon} size={16} />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={
                    onThisDevice.has(download.id)
                      ? say('screens.downloadList.deleteHere', { title: download.title })
                      : say('screens.downloadList.deleteServer', { title: download.title })
                  }
                  onClick={() => {
                    setDeleting(download);
                  }}
                >
                  <Icon of={BinIcon} size={16} />
                </Button>
              </SettingRow>
            ))}
          </SettingList>
        </section>
      ))}

      <ConfirmDialog
        title={
          deleting === null
            ? say('screens.downloadList.deleteUnnamedTitle')
            : say('screens.downloadList.deleteTitle', { title: deleting.title })
        }
        detail={
          deletingHere
            ? say('screens.downloadList.deleteHereDetail')
            : say('screens.downloadList.deleteServerDetail')
        }
        confirmLabel={say('common.delete')}
        isDestructive
        isBusy={isDeleting}
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting !== null) {
            deleteIt(deleting);
          }
        }}
      />
    </div>
  );
};

DownloadList.displayName = 'DownloadList';

export { DownloadList };
