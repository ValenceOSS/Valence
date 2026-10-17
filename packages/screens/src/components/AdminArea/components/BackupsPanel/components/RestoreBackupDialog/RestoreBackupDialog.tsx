import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { CopyableAddress } from '@ValenceScreens/components/CopyableAddress/CopyableAddress';
import { DOCKER_COMMANDS } from '@ValenceScreens/admin/DOCKER_COMMANDS';
import { say } from '@ValenceI18n/say';
import type { RestoreBackupDialogProps } from './RestoreBackupDialog.types';

/**
 * How to put one copy of the database back. It cannot be done from here: restoring replaces the
 * database the running server is using, so the server has to be stopped first and the copy put back
 * from beside it, with the commands to do that ready to copy.
 *
 * @param backup - The copy to put back, or null while the dialog is closed.
 * @param restoreCommand - What to run, with the copy's name after it.
 * @param onClose - Called to close the dialog.
 */
const RestoreBackupDialog = ({ backup, restoreCommand, onClose }: RestoreBackupDialogProps) => (
  <Dialog
    label={say('screens.adminArea.restoreBackupDialog.putThisBackupBack')}
    isOpen={backup !== null}
    onClose={onClose}
    className="sm:w-[min(36rem,92vw)]"
  >
    <DialogTitle
      title={say('screens.adminArea.restoreBackupDialog.putThisBackupBack')}
      detail={say('screens.adminArea.restoreBackupDialog.everythingWrittenSinceItWasTaken')}
    />

    <DialogContent>
      <ol className="flex flex-col gap-3">
        <li>
          <CopyableAddress
            title={say('screens.adminArea.restoreBackupDialog.stopValence')}
            detail={say('screens.adminArea.restoreBackupDialog.theDatabaseCannotBeReplaced')}
            address={DOCKER_COMMANDS.stop}
          />
        </li>
        <li>
          <CopyableAddress
            title={say('screens.adminArea.restoreBackupDialog.putTheCopyBack')}
            detail={say('screens.adminArea.restoreBackupDialog.runThisBesideYourComposeFile')}
            address={`${restoreCommand} ${backup?.name ?? ''}`}
          />
        </li>
        <li>
          <CopyableAddress
            title={say('screens.adminArea.restoreBackupDialog.startValenceAgain')}
            detail={
              backup?.before === null || backup?.before === undefined
                ? say('screens.adminArea.restoreBackupDialog.startTheSameRelease')
                : say('screens.adminArea.restoreBackupDialog.startTheReleaseFromBeforeTheUpgrade')
            }
            address={DOCKER_COMMANDS.start}
          />
        </li>
      </ol>
    </DialogContent>

    <DialogFooter confirm={{ label: say('common.done'), onChoose: onClose }} />
  </Dialog>
);

RestoreBackupDialog.displayName = 'RestoreBackupDialog';

export { RestoreBackupDialog };
