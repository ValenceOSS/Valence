import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FolderBrowser } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/FolderBrowser';
import type { MoveEntryDialogProps } from './MoveEntryDialog.types';

/**
 * Chooses the folder to move a file or folder into, with the same folder browser a library's folder
 * is chosen with, opened on the folder it is in now. The server refuses a folder outside every
 * library, so the browser can be walked freely.
 *
 * @param entry - What is being moved, or nothing while the dialog is shut.
 * @param start - The folder to open on.
 * @param onClose - Called when it is dismissed.
 * @param onMove - Told the folder chosen.
 */
const MoveEntryDialog = ({ entry, start, onClose, onMove }: MoveEntryDialogProps) => (
  <DialogCompanion label="Move" isOpen={entry !== null} onClose={onClose}>
    <DialogTitle
      size="compact"
      title={`Move ${entry?.name ?? 'this'}`}
      detail="Choose the folder to put it in. It keeps its name."
    />

    <DialogContent>
      <FolderBrowser start={start} onChoose={onMove} onCancel={onClose} />
    </DialogContent>
  </DialogCompanion>
);

MoveEntryDialog.displayName = 'MoveEntryDialog';

export { MoveEntryDialog };
