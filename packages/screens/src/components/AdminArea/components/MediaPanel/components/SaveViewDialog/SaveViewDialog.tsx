import { useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import type { SaveViewDialogProps } from './SaveViewDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks what to call the view of Media's list being saved: the library's filters, search and order
 * as they stand.
 *
 * @param isOpen - Whether it is open.
 * @param onClose - Closes it.
 * @param onSave - Told the name to save the view under.
 */
const SaveViewDialog = ({ isOpen, onClose, onSave }: SaveViewDialogProps) => {
  const [name, setName] = useState('');
  const save = () => {
    if (name.trim() !== '') {
      onSave(name.trim().slice(0, 64));
      setName('');
    }
  };

  return (
    <Dialog
      label={say('screens.adminArea.savedViews.nameThisView')}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.savedViews.nameThisView')}
        detail={say('screens.adminArea.savedViews.keptOnThisDeviceForThisLibrary')}
      />
      <DialogContent>
        <TextField
          label={say('screens.adminArea.savedViews.viewName')}
          value={name}
          onValueChange={setName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              save();
            }
          }}
        />
      </DialogContent>
      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.adminArea.savedViews.saveView'),
          onChoose: save,
          isDisabled: name.trim() === '',
        }}
      />
    </Dialog>
  );
};

SaveViewDialog.displayName = 'SaveViewDialog';

export { SaveViewDialog };
