import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import type { RemoveDownloadDialogProps } from './RemoveDownloadDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Asks before taking downloads out of their clients — one, or several ticked together — and whether
 * what they downloaded should go with them, which starts unticked, since a finished download may be
 * the only copy there is.
 *
 * @param downloads - The downloads to remove, or none while nothing is being removed.
 * @param keepsFinishedFiles - Whether their clients keep what they finished whatever they are told,
 *   as NZBGet does, so the choice would promise something it cannot do.
 * @param onClose - Told when it was dismissed without removing anything.
 * @param onConfirm - Told to remove it, and whether to delete what it downloaded.
 */
const RemoveDownloadDialog = ({
  downloads,
  keepsFinishedFiles = false,
  onClose,
  onConfirm,
}: RemoveDownloadDialogProps) => {
  const [deleteData, setDeleteData] = useState(false);
  const [shownFor, setShownFor] = useState(downloads);
  const [download] = downloads;
  const isOne = downloads.length === 1 && download !== undefined;

  if (shownFor !== downloads) {
    setShownFor(downloads);
    setDeleteData(false);
  }

  const title =
    download === undefined
      ? say('screens.adminArea.removeDownloadDialog.removeThisDownload')
      : isOne
        ? say('common.removeName', { name: download.title })
        : sayCount('screens.adminArea.removeDownloadDialog.removeCountDownloads', downloads.length);

  return (
    <Dialog
      label={title}
      isOpen={downloads.length > 0}
      onClose={onClose}
      className="sm:w-[min(28rem,92vw)]"
    >
      <DialogTitle title={title} />

      <DialogContent className="flex flex-col gap-3">
        <p className="font-body text-sm text-text-muted">
          {!isOne
            ? downloads.length > 1
              ? say('screens.adminArea.removeDownloadDialog.theyAreTakenOutOfTheirClients')
              : say('screens.adminArea.removeDownloadDialog.itIsTakenOutOfItsClient')
            : say('screens.adminArea.removeDownloadDialog.itIsTakenOutOfName', {
                name: download.clientName,
              })}
        </p>

        {keepsFinishedFiles ? (
          <p className="font-body text-sm text-text-muted">
            {!isOne
              ? say('screens.adminArea.removeDownloadDialog.theClientKeepsWhatItHasFinished')
              : say('screens.adminArea.removeDownloadDialog.nameKeepsWhatItHasFinished', {
                  name: download.clientName,
                })}
          </p>
        ) : (
          <Checkbox
            label={say('screens.adminArea.removeDownloadDialog.deleteWhatItDownloadedAsWell')}
            checked={deleteData}
            onCheckedChange={setDeleteData}
          />
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('common.forget'),
          onChoose: () => {
            onConfirm(deleteData && !keepsFinishedFiles);
          },
        }}
      />
    </Dialog>
  );
};

RemoveDownloadDialog.displayName = 'RemoveDownloadDialog';

export { RemoveDownloadDialog };
