import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { DOWNLOAD_STOP_NEXT } from '@ValenceContracts/schemas/MediaRequest';
import type { DownloadStopNext } from '@ValenceContracts/schemas/MediaRequest';
import type { StopDownloadDialogProps } from './StopDownloadDialog.types';
import { say } from '@ValenceI18n/say';

const CHOICES: readonly { id: DownloadStopNext; title: string; detail: string }[] = [
  {
    id: 'another',
    title: say('screens.adminArea.titlePage.stopDownloadDialog.findADifferentRelease'),
    detail: say('screens.adminArea.titlePage.stopDownloadDialog.blocksThisReleaseAndSearchesAgain'),
  },
  {
    id: 'byHand',
    title: say('screens.adminArea.titlePage.stopDownloadDialog.pickOneMyself'),
    detail: say('screens.adminArea.titlePage.stopDownloadDialog.blocksThisReleaseAndOpens'),
  },
  {
    id: 'nothing',
    title: say('screens.adminArea.titlePage.stopDownloadDialog.stopGettingThis'),
    detail: say('screens.adminArea.titlePage.stopDownloadDialog.stopsFollowingWhatItWasFor'),
  },
];

/**
 * Asks what happens once one of a title's downloads is stopped: look for a different release, pick
 * one by hand, or stop getting what it was for, and whether what it downloaded so far is deleted,
 * which starts ticked, since a release being given up on is rarely worth keeping half of.
 *
 * @param download - The download, or nothing while the dialog is closed.
 * @param appName - The connected app the download is in, which always deletes what it downloaded,
 *   or nothing for one of Valence's own.
 * @param isStopping - Whether it is being stopped.
 * @param onClose - Told when it was dismissed.
 * @param onStop - Told what comes next, and whether to delete what it downloaded.
 */
const StopDownloadDialog = ({
  download,
  appName = null,
  isStopping,
  onClose,
  onStop,
}: StopDownloadDialogProps) => {
  const [next, setNext] = useState<DownloadStopNext>('another');
  const [isDeleting, setIsDeleting] = useState(true);
  const [shownFor, setShownFor] = useState(download);

  if (shownFor !== download) {
    setShownFor(download);
    setNext('another');
    setIsDeleting(true);
  }

  const title =
    download === null
      ? say('screens.adminArea.titlePage.downloadRow.stopDownload')
      : say('screens.adminArea.titlePage.stopDownloadDialog.stopTitle', {
          title: download.releaseTitle,
        });

  return (
    <Dialog
      label={title}
      isOpen={download !== null}
      onClose={onClose}
      className="sm:w-[min(32rem,92vw)]"
    >
      <DialogTitle title={title} />

      <DialogContent className="flex flex-col gap-4">
        <ChoiceList
          label={say('screens.adminArea.titlePage.stopDownloadDialog.thenWhat')}
          choices={CHOICES}
          value={next}
          onChoose={(chosen) => {
            const found = DOWNLOAD_STOP_NEXT.find((one) => one === chosen);

            if (found !== undefined) {
              setNext(found);
            }
          }}
        />

        {appName === null ? (
          <Checkbox
            label={say(
              'screens.adminArea.titlePage.stopDownloadDialog.deleteWhatItDownloadedSoFar',
            )}
            checked={isDeleting}
            onCheckedChange={setIsDeleting}
          />
        ) : (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.titlePage.stopDownloadDialog.nameDeletesWhatItDownloaded', {
              name: appName,
            })}
          </p>
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.adminArea.titlePage.stopDownloadDialog.stopIt'),
          isDestructive: true,
          isLoading: isStopping,
          onChoose: () => {
            onStop(next, isDeleting);
          },
        }}
      />
    </Dialog>
  );
};

StopDownloadDialog.displayName = 'StopDownloadDialog';

export { StopDownloadDialog };
