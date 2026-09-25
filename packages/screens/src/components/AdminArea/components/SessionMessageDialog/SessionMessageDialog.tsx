import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { SESSION_MESSAGE_MAX_LENGTH } from '@ValenceContracts/schemas/SessionMessage';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { SessionMessageDialogProps } from './SessionMessageDialog.types';

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
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setIsSending(false);
    }
  }, [isOpen]);

  const trimmed = text.trim();
  const isTooLong = trimmed.length > SESSION_MESSAGE_MAX_LENGTH;
  const canSend = trimmed !== '' && !isTooLong && !isSending;

  const send = async () => {
    setIsSending(true);
    await onSend(trimmed);
    setIsSending(false);
    onClose();
  };

  return (
    <Dialog label={say('admin.sessionMessageDialog.label')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle title={say('admin.sessionMessageDialog.title', { watcher })}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent>
        <div className="flex flex-col gap-2">
          <TextField
            label={say('admin.sessionMessageDialog.fieldLabel')}
            value={text}
            onValueChange={setText}
            placeholder={say('admin.sessionMessageDialog.placeholder')}
            hasFocusOnMount
            {...(isTooLong ? { error: say('admin.sessionMessageDialog.tooLong') } : {})}
          />

          <p className="text-xs text-text-muted">
            {sayCount('admin.sessionMessageDialog.length', SESSION_MESSAGE_MAX_LENGTH, {
              length: trimmed.length.toString(),
            })}
          </p>
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('admin.sessionMessageDialog.send'),
          onChoose: () => {
            void send();
          },
          isDisabled: !canSend,
          isLoading: isSending,
        }}
      />
    </Dialog>
  );
};

SessionMessageDialog.displayName = 'SessionMessageDialog';

export { SessionMessageDialog };
