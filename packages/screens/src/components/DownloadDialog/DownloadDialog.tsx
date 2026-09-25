import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react';
import { Callout } from '@ValenceUI/Callout';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { judgeFreeSpace } from '@ValenceCore/functions/judgeFreeSpace';
import {
  askForDownload,
  askForSeries,
  fetchDownloadOffer,
  fetchSeriesDownloadOffer,
} from '@ValenceClient/downloads/fetchDownloads';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { detectFromBrowser } from '@ValenceScreens/playback/detectDeviceProfile';
import { readFreeSpace } from '@ValenceScreens/downloads/readFreeSpace';
import type { DownloadQuality } from '@ValenceContracts/schemas/Download';
import type { DownloadDialogProps } from './DownloadDialog.types';

/**
 * Chooses what to download, and says what each choice costs before anybody commits to it.
 *
 * Every rung is shown with its size, what it looks like in words, and how it reads against the
 * original — because somebody opening this is choosing between them, not judging each on its own.
 * A number in small grey text is documentation; a comparison is what somebody acts on.
 *
 * Where the device will say how much room it has left, the sizes are read against it. "58 GB, and
 * you have 41 GB free" is the sentence that prevents the mistake; "58 GB" is the one that merely
 * records it. Anything that will not fit says so before the transfer starts rather than failing
 * part way through, and anything that would take most of what is left is called tight rather than
 * fine.
 *
 * A rung this device cannot play is offered anyway, with a word about it. Somebody may want the
 * original to keep or to watch elsewhere, and that is theirs to decide knowingly rather than to be
 * quietly decided for them.
 *
 * Where a whole programme is being asked for, the figures are what the season costs rather than
 * what one episode does. Nobody downloads one episode of a series, and "roughly 6 GB for thirteen"
 * is the number that decides it — "460 MB" is not, however accurate it is about the first one.
 *
 * @param media - What is being downloaded, or nothing while the dialog is shut.
 * @param series - The programme being downloaded, whole or the episodes of it chosen, where it is
 *   one.
 * @param onClose - Told it was dismissed.
 */
const DownloadDialog = ({ media, series = null, onClose }: DownloadDialogProps) => {
  const cache = useQueryClient();
  const [chosen, setChosen] = useState<DownloadQuality | null>(null);
  const [freeBytes, setFreeBytes] = useState<number | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (media === null) {
      return;
    }

    let abandoned = false;

    void readFreeSpace().then((found) => {
      if (!abandoned) {
        setFreeBytes(found);
      }
    });

    return () => {
      abandoned = true;
    };
  }, [media]);

  const isOpen = media !== null || series !== null;

  const asked = useQuery({
    queryKey: ['downloads', 'offer', series?.id ?? media?.id ?? '', series?.mediaIds ?? null],
    queryFn: () =>
      series === null
        ? fetchDownloadOffer(media?.id ?? '', detectFromBrowser())
        : fetchSeriesDownloadOffer(series.id, detectFromBrowser(), series.mediaIds),
    enabled: isOpen,
  });

  const offer = asked.data ?? null;
  const episodes = offer?.episodes ?? series?.episodes ?? 1;
  const options = offer?.options ?? [];
  const picked = options.find((one) => one.quality === chosen) ?? options[0] ?? null;
  const verdict = judgeFreeSpace({ bytes: picked?.bytes ?? null, freeBytes });

  return (
    <Dialog
      label={`Download ${series?.title ?? media?.title ?? ''}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        title="Download"
        detail={
          series === null
            ? (media?.title ?? '')
            : `${series.title} — ${episodes === 1 ? '1 episode' : `${episodes.toString()} episodes`}`
        }
      />

      <DialogContent>
        {asked.isPending ? (
          <Spinner isCentered label="Working out what this would cost" size="sm" />
        ) : options.length === 0 ? (
          <p className="px-6 py-8 font-body text-sm text-text-muted">
            Nothing can be prepared for this yet.
          </p>
        ) : (
          <ChoiceList
            label="How large to make it"
            value={picked?.quality ?? null}
            onChoose={(id) => {
              const found = options.find((option) => option.quality === id);

              if (found !== undefined) {
                setChosen(found.quality);
              }
            }}
            choices={options.map((option) => ({
              id: option.quality,
              title: option.label,
              detail: option.meaning,
              ...(option.wouldTranscode ? { note: 'Converted' } : {}),
              aside: (
                <span className="flex max-w-40 flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold tabular-nums text-text">
                    {option.bytes === null
                      ? 'Size unknown'
                      : series === null
                        ? formatBytes(option.bytes)
                        : `about ${formatBytes(option.bytes)}`}
                  </span>

                  {option.comparison === null ? null : (
                    <span className="text-xs text-text-muted">{option.comparison}</span>
                  )}
                </span>
              ),
            }))}
          />
        )}

        {verdict === 'unknown' ? null : verdict === 'fits' ? (
          <p className="mt-4 font-body text-sm text-text-muted">
            {`${formatBytes(picked?.bytes ?? 0)}, and this device has ${formatBytes(freeBytes ?? 0)} free.`}
          </p>
        ) : (
          <Callout
            className="mt-4"
            tone={verdict === 'willNotFit' ? 'danger' : 'warning'}
            icon={TriangleAlertIcon}
            title={verdict === 'willNotFit' ? 'That will not fit' : 'That is most of what is left'}
          >
            {verdict === 'willNotFit'
              ? `It needs ${formatBytes(picked?.bytes ?? 0)}, and this device has ${formatBytes(freeBytes ?? 0)} free.`
              : `${formatBytes(picked?.bytes ?? 0)} of the ${formatBytes(freeBytes ?? 0)} free on this device.`}
          </Callout>
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label:
            series === null
              ? 'Prepare it'
              : `Queue ${episodes === 1 ? '1 episode' : `${episodes.toString()} episodes`}`,
          isLoading: isAsking,
          isDisabled: picked === null || verdict === 'willNotFit',
          onChoose: () => {
            if (picked === null || (media === null && series === null)) {
              return;
            }

            setIsAsking(true);

            void (
              series === null
                ? askForDownload(media?.id ?? '', picked.quality).then(
                    (started) => started !== null,
                  )
                : askForSeries(series.id, picked.quality, [], series.mediaIds).then(
                    (queued) => queued.length > 0,
                  )
            )
              .then(async (started) => {
                if (!started) {
                  notify.failed('That could not be started.');

                  return;
                }

                await cache.invalidateQueries({ queryKey: downloadQueries.key });
                notify.worked('The server is preparing it', {
                  description:
                    'Valence can be closed in the meantime. You will get a notification when it is ready, and it comes to this device the next time Valence is open.',
                });
                onClose();
              })
              .catch(() => {
                notify.failed('That could not be started.');
              })
              .finally(() => {
                setIsAsking(false);
              });
          },
        }}
      />
    </Dialog>
  );
};

DownloadDialog.displayName = 'DownloadDialog';

export { DownloadDialog };
