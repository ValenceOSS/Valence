import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import { NameEntryFormSchema } from './NameEntryFormSchema';
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
  const form = useZodForm(NameEntryFormSchema, { name: initialName }, (answers) =>
    onName(answers.name),
  );
  const isUnchanged = form.values.name.trim() === initialName;

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle size="compact" title={title} />

      <Form label={title} onSubmit={form.submit} isDialog>
        <DialogContent>
          <TextField
            label={say('common.name')}
            {...form.text('name')}
            {...(form.problem === null ? {} : { error: form.problem })}
            hasFocusOnMount
          />
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: confirmLabel,
            isSubmit: true,
            isLoading: form.isSubmitting,
            isDisabled: isUnchanged,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

NameEntryDialog.displayName = 'NameEntryDialog';

export { NameEntryDialog };
