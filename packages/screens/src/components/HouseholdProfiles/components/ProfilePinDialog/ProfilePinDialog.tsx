import { useEffect, useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { Form } from '@ValenceUI/Form';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import type { ProfilePinDialogProps } from './ProfilePinDialog.types';
import { say } from '@ValenceI18n/say';
import { isAPin } from '@ValenceContracts/functions/isAPin';

/**
 * Asks for a new PIN for a profile, twice, so a slip of the finger does not lock somebody out.
 *
 * @param name - Whose PIN it is.
 * @param isOpen - Whether it is shown.
 * @param onClose - Told to put it away.
 * @param onSave - Told the new PIN, answering whether it was kept.
 */
const ProfilePinDialog = ({ name, isOpen, onClose, onSave }: ProfilePinDialogProps) => {
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setAgain('');
    }
  }, [isOpen]);

  const isReady = isAPin(pin) && pin === again;
  const title = say('screens.householdProfiles.pinForName', { name });

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle size="compact" title={title} />

      <Form
        label={title}
        isDialog
        onSubmit={(event) => {
          event.preventDefault();

          if (!isReady) {
            return;
          }

          setIsSaving(true);
          void onSave(pin).then((isKept) => {
            setIsSaving(false);

            if (isKept) {
              onClose();
            }
          });
        }}
      >
        <DialogContent className="flex flex-col gap-4">
          <TextField
            label={say('screens.whoIsWatching.newPin')}
            description={say('screens.whoIsWatching.fourToEightDigits')}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={pin}
            onValueChange={(typed) => {
              setPin(typed.replace(/\D/gu, '').slice(0, 8));
            }}
            hasFocusOnMount
          />

          <TextField
            label={say('screens.whoIsWatching.typeThePinAgain')}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={again}
            onValueChange={(typed) => {
              setAgain(typed.replace(/\D/gu, '').slice(0, 8));
            }}
            {...(again !== '' && again !== pin
              ? { error: say('screens.whoIsWatching.thosePinsDoNotMatch') }
              : {})}
          />
        </DialogContent>

        <DialogFooter
          dismiss={{ label: say('common.cancel'), onChoose: onClose }}
          confirm={{
            label: say('common.save'),
            isSubmit: true,
            isLoading: isSaving,
            isDisabled: !isReady,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

ProfilePinDialog.displayName = 'ProfilePinDialog';

export { ProfilePinDialog };
