import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { NAME_MAX } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileNameDialogProps } from './ProfileNameDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks what a profile should be called, for one being renamed.
 *
 * @param title - What the dialog is for.
 * @param initialName - What it is called now.
 * @param isOpen - Whether it is shown.
 * @param onClose - Told to put it away.
 * @param onSave - Told the new name, answering whether it was kept.
 */
const ProfileNameDialog = ({
  title,
  initialName,
  isOpen,
  onClose,
  onSave,
}: ProfileNameDialogProps) => {
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  const wanted = name.trim();

  return (
    <Dialog label={title} isOpen={isOpen} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (wanted === '' || wanted.length > NAME_MAX) {
            return;
          }

          setIsSaving(true);
          void onSave(wanted).then((isKept) => {
            setIsSaving(false);

            if (isKept) {
              onClose();
            }
          });
        }}
      >
        <DialogTitle title={title} />

        <DialogContent>
          <TextField
            label={say('common.name')}
            value={name}
            onValueChange={setName}
            autoComplete="off"
            hasFocusOnMount
          />
        </DialogContent>

        <DialogFooter
          dismiss={{ label: say('common.cancel'), onChoose: onClose }}
          confirm={{
            label: say('common.save'),
            isSubmit: true,
            isLoading: isSaving,
            isDisabled: wanted === '' || wanted.length > NAME_MAX,
          }}
        />
      </form>
    </Dialog>
  );
};

ProfileNameDialog.displayName = 'ProfileNameDialog';

export { ProfileNameDialog };
