import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react/fill';
import { useEffect } from 'react';
import { z } from 'zod';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { DEVICE_WORDS_LONGEST } from '@ValenceContracts/schemas/DeviceIdentity';
import { Form } from '@ValenceUI/Form';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import type { RenameDeviceDialogProps } from './RenameDeviceDialog.types';
import { say } from '@ValenceI18n/say';

const RenameSchema = z.object({ name: z.string().trim().max(DEVICE_WORDS_LONGEST) });

/**
 * Where somebody gives one of their devices a name of their own, so a list of two iPhones or three
 * browsers says which is which. Emptying the field gives the device back the name Valence gave it,
 * and the field says what that name is so nobody has to guess.
 *
 * @param ownName - What Valence calls the device, such as "iPhone 17 Pro Max".
 * @param renamed - What its owner already renamed it to, where they did.
 * @param isOpen - Whether the dialog is showing.
 * @param onRename - Called with the new name, or nothing to go back to its own.
 * @param onClose - Called when it is dismissed.
 * @returns The dialog.
 */
const RenameDeviceDialog = ({
  ownName,
  renamed,
  isOpen,
  onRename,
  onClose,
}: RenameDeviceDialogProps) => {
  const form = useZodForm(RenameSchema, { name: renamed ?? '' }, async ({ name }) => {
    await onRename(name === '' ? null : name);
    onClose();

    return null;
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
      reset({ name: renamed ?? '' });
    }
  }, [isOpen, renamed, reset]);

  return (
    <Dialog
      label={say('screens.accountArea.deviceList.renameThisDevice')}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle title={say('screens.accountArea.deviceList.renameThisDevice')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <Form
        label={say('screens.accountArea.deviceList.renameThisDevice')}
        onSubmit={form.submit}
        isDialog
      >
        <DialogContent>
          <div className="flex flex-col gap-2">
            <TextField
              label={say('common.name')}
              {...form.text('name')}
              placeholder={ownName}
              hasFocusOnMount
            />

            <p className="text-xs text-text-muted">
              {say('screens.accountArea.deviceList.leaveItEmptyToGoBack', { name: ownName })}
            </p>
          </div>
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: onClose }}
          confirm={{ label: say('common.save'), isSubmit: true, isLoading: form.isSubmitting }}
        />
      </Form>
    </Dialog>
  );
};

RenameDeviceDialog.displayName = 'RenameDeviceDialog';

export { RenameDeviceDialog };
