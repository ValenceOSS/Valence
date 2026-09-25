import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import type { RemoveDownloadDialogProps } from './RemoveDownloadDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks before taking a download out of its client, and whether what it downloaded should go with
 * it — which starts unticked, since a finished download may be the only copy there is.
 *
 * @param download - The download to remove, or null while nothing is being removed.
 * @param keepsFinishedFiles - Whether its client keeps what it finished whatever it is told, as
 *   NZBGet does, so the choice would promise something it cannot do.
 * @param onClose - Told when it was dismissed without removing anything.
 * @param onConfirm - Told to remove it, and whether to delete what it downloaded.
 */
const RemoveDownloadDialog = ({
  download,
  keepsFinishedFiles = false,
  onClose,
  onConfirm,
}: RemoveDownloadDialogProps) => {
  const [deleteData, setDeleteData] = useState(false);
  const [shownFor, setShownFor] = useState(download);

  if (shownFor !== download) {
    setShownFor(download);
    setDeleteData(false);
  }

  const title =
    download === null
      ? say('admin.removeDownloadDialog.titleThis')
      : say('admin.removeDownloadDialog.title', { title: download.title });

  return (
    <Dialog
      label={title}
      isOpen={download !== null}
      onClose={onClose}
      className="sm:w-[min(28rem,92vw)]"
    >
      <DialogTitle title={title} />

      <DialogContent className="flex flex-col gap-3">
        <p className="font-body text-sm text-text-muted">
          {download === null
            ? say('admin.removeDownloadDialog.takenOutOfItsClient')
            : say('admin.removeDownloadDialog.takenOutOf', { client: download.clientName })}
        </p>

        {keepsFinishedFiles ? (
          <p className="font-body text-sm text-text-muted">
            {download === null
              ? say('admin.removeDownloadDialog.theClientKeepsFiles')
              : say('admin.removeDownloadDialog.keepsFiles', { client: download.clientName })}
          </p>
        ) : (
          <Checkbox
            label={say('admin.removeDownloadDialog.deleteData')}
            checked={deleteData}
            onCheckedChange={setDeleteData}
          />
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('admin.removeDownloadDialog.remove'),
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
