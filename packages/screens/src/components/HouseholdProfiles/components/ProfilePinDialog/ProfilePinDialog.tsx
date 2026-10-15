import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import type { ProfilePinDialogProps } from './ProfilePinDialog.types';
import { say } from '@ValenceI18n/say';

const PIN = /^\d{4,8}$/u;

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

  const isReady = PIN.test(pin) && pin === again;
  const title = say('screens.householdProfiles.pinForName', { name });

  return (
    <Dialog label={title} isOpen={isOpen} onClose={onClose}>
      <form
        noValidate
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
        <DialogTitle title={title} />

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
      </form>
    </Dialog>
  );
};

ProfilePinDialog.displayName = 'ProfilePinDialog';

export { ProfilePinDialog };
