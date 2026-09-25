import { useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import type { NameEntryDialogProps } from './NameEntryDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks for one name — for something being renamed, or a folder being made — and keeps asking, with
 * the server's words under the field, where the name would not do.
 *
 * @param isOpen - Whether it is showing.
 * @param title - What it is asking for.
 * @param initialName - The name it starts with, such as the one being changed.
 * @param confirmLabel - What the confirming button says.
 * @param onClose - Called when it is dismissed.
 * @param onName - Told the name, answering why it would not do, or nothing where it did.
 */
const NameEntryDialog = ({
  isOpen,
  title,
  initialName,
  confirmLabel,
  onClose,
  onName,
}: NameEntryDialogProps) => {
  const [name, setName] = useState(initialName);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = () => {
    setIsSaving(true);
    setProblem(null);

    void onName(name.trim()).then((said) => {
      setIsSaving(false);
      setProblem(said);
    });
  };

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle size="compact" title={title} />

      <DialogContent>
        <TextField
          label={say('admin.nameEntryDialog.name')}
          value={name}
          onValueChange={setName}
          hasFocusOnMount
          {...(problem === null ? {} : { error: problem })}
        />
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: confirmLabel,
          onChoose: save,
          isLoading: isSaving,
          isDisabled: name.trim() === '' || name.trim() === initialName,
        }}
      />
    </DialogCompanion>
  );
};

NameEntryDialog.displayName = 'NameEntryDialog';

export { NameEntryDialog };
