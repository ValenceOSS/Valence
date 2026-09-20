import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import type { RemoveDownloadDialogProps } from './RemoveDownloadDialog.types';

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

  const title = `Remove ${download?.title ?? 'this download'}?`;

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
          It is taken out of {download?.clientName ?? 'its client'}, and Valence stops following it.
        </p>

        {keepsFinishedFiles ? (
          <p className="font-body text-sm text-text-muted">
            {download?.clientName ?? 'The client'} keeps what it has finished with, so its files
            stay where they are.
          </p>
        ) : (
          <Checkbox
            label="Delete what it downloaded as well"
            checked={deleteData}
            onCheckedChange={setDeleteData}
          />
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            onConfirm(deleteData && !keepsFinishedFiles);
          }}
        >
          Remove
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

RemoveDownloadDialog.displayName = 'RemoveDownloadDialog';

export { RemoveDownloadDialog };
