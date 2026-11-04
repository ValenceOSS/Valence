import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FolderBrowser } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/FolderBrowser';
import type { MoveEntryDialogProps } from './MoveEntryDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Chooses the folder to move a file or folder, or several, into, with the same folder browser a library's folder
 * is chosen with, opened on the folder it is in now. The server refuses a folder outside every
 * library, so the browser can be walked freely.
 *
 * @param name - What is being moved, one thing or how many, or nothing while the dialog is shut.
 * @param start - The folder to open on.
 * @param onClose - Called when it is dismissed.
 * @param onMove - Told the folder chosen.
 */
const MoveEntryDialog = ({ name, start, onClose, onMove }: MoveEntryDialogProps) => (
  <DialogCompanion label={say('common.move')} isOpen={name !== null} onClose={onClose}>
    <DialogTitle
      size="compact"
      title={
        name === null
          ? say('screens.filesPanel.moveEntryDialog.moveThis')
          : say('screens.filesPanel.moveEntryDialog.moveName', { name })
      }
      detail={say('screens.filesPanel.moveEntryDialog.chooseTheFolderToPutIt')}
    />

    <DialogContent>
      <FolderBrowser start={start} onChoose={onMove} onCancel={onClose} />
    </DialogContent>
  </DialogCompanion>
);

MoveEntryDialog.displayName = 'MoveEntryDialog';

export { MoveEntryDialog };
