import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import type { RemoveTitleDialogProps } from './RemoveTitleDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks before a title's request is removed, which stops whatever it is downloading, and whether
 * the files it added to the library go too — unticked to start with, as Sonarr has it, since
 * those files may be all there is.
 *
 * @param title - The title, or nothing while the dialog is closed.
 * @param isRemoving - Whether it is being removed.
 * @param onClose - Told when it was dismissed.
 * @param onRemove - Told to remove it, and whether its files go too.
 */
const RemoveTitleDialog = ({ title, isRemoving, onClose, onRemove }: RemoveTitleDialogProps) => {
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  const [shownFor, setShownFor] = useState(title);

  if (shownFor !== title) {
    setShownFor(title);
    setIsDeletingFiles(false);
  }

  const heading =
    title === null
      ? say('screens.adminArea.titlePage.removeTitleDialog.removeThisRequest')
      : say('common.removeName', { name: title });

  return (
    <Dialog
      label={heading}
      isOpen={title !== null}
      onClose={onClose}
      className="sm:w-[min(28rem,92vw)]"
    >
      <DialogTitle title={heading} />

      <DialogContent className="flex flex-col gap-3">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.titlePage.removeTitleDialog.itStopsDownloadingAndNothing')}
        </p>

        <Checkbox
          label={say('screens.adminArea.titlePage.removeTitleDialog.deleteTheFilesItAdded')}
          description={say(
            'screens.adminArea.titlePage.removeTitleDialog.onlyFilesValenceFiledFor',
          )}
          checked={isDeletingFiles}
          onCheckedChange={setIsDeletingFiles}
        />
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('common.forget'),
          isDestructive: true,
          isLoading: isRemoving,
          onChoose: () => {
            onRemove(isDeletingFiles);
          },
        }}
      />
    </Dialog>
  );
};

RemoveTitleDialog.displayName = 'RemoveTitleDialog';

export { RemoveTitleDialog };
