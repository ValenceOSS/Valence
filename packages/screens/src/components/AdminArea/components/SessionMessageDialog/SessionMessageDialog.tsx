import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react/fill';
import { useEffect } from 'react';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import { SessionMessageFormSchema } from './SessionMessageFormSchema';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { SESSION_MESSAGE_MAX_LENGTH } from '@ValenceContracts/schemas/SessionMessage';
import type { SessionMessageDialogProps } from './SessionMessageDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Where an operator types the line a viewer will read.
 *
 * The length is shown rather than enforced by truncation, because a sentence three words too long
 * should be shortened deliberately by the person writing it — silently losing its ending is how a
 * message comes out meaning something else.
 *
 * @param watcher - Who is going to read it, so the operator can see they picked the right screen.
 * @param isOpen - Whether the dialog is showing.
 * @param onSend - Called with the message to deliver.
 * @param onClose - Called when it is dismissed.
 * @returns The dialog.
 */
const SessionMessageDialog = ({ watcher, isOpen, onSend, onClose }: SessionMessageDialogProps) => {
  const form = useZodForm(SessionMessageFormSchema, { text: '' }, async (answers) => {
    await onSend(answers.text);
    onClose();

    return null;
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
      reset({ text: '' });
    }
  }, [isOpen, reset]);

  const trimmed = form.values.text.trim();

  return (
    <Dialog
      label={say('screens.adminArea.sessionMessageDialog.sendAMessage')}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        title={say('screens.adminArea.sessionMessageDialog.messageWatcher', { watcher })}
      >
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <Form
        label={say('screens.adminArea.sessionMessageDialog.sendAMessage')}
        onSubmit={form.submit}
        isDialog
      >
        <DialogContent>
          <div className="flex flex-col gap-2">
            <TextField
              label={say('screens.adminArea.sessionMessageDialog.whatToTellThem')}
              {...form.text('text')}
              placeholder={say('screens.adminArea.sessionMessageDialog.restartingInFiveMinutes')}
              hasFocusOnMount
            />

            <p className="text-xs text-text-muted">
              {say('screens.adminArea.sessionMessageDialog.lengthOfSESSIONMESSAGEMAXLENGTH', {
                length: trimmed.length.toString(),
                SESSION_MESSAGE_MAX_LENGTH: SESSION_MESSAGE_MAX_LENGTH.toString(),
              })}
            </p>
          </div>
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: say('screens.adminArea.sessionMessageDialog.send'),
            isSubmit: true,
            isLoading: form.isSubmitting,
          }}
        />
      </Form>
    </Dialog>
  );
};

SessionMessageDialog.displayName = 'SessionMessageDialog';

export { SessionMessageDialog };
