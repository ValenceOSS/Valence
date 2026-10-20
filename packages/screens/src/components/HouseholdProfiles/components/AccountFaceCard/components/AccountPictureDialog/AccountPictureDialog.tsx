import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { notify } from '@ValenceUI/notify';
import { saveHousehold, uploadHouseholdPhoto } from '@ValenceClient/household/fetchHousehold';
import { AccountAvatarPicker } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/components/AccountAvatarPicker/AccountAvatarPicker';
import { say } from '@ValenceI18n/say';
import type { AccountAvatarDraft } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/components/AccountAvatarPicker/AccountAvatarPicker.types';
import type { AccountPictureDialogProps } from './AccountPictureDialog.types';

/**
 * Gives an account a picture of its own — a photograph, a drawn face, and the colour behind them —
 * chosen the way an administrator chooses one for somebody else's account, and kept only once saved.
 *
 * @param isOpen - Whether it is showing.
 * @param seed - What a drawn face is drawn from, so the same account always draws the same one.
 * @param household - How the account looks now.
 * @param onClose - Told to close without saving.
 * @param onSaved - Told once the picture is kept.
 */
const AccountPictureDialog = ({
  isOpen,
  seed,
  household,
  onClose,
  onSaved,
}: AccountPictureDialogProps) => {
  const [draft, setDraft] = useState<AccountAvatarDraft>({
    avatar: household.avatar,
    colour: household.colour,
    photo: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft({ avatar: household.avatar, colour: household.colour, photo: null });
    }
  }, [isOpen, household.avatar, household.colour]);

  const save = async (): Promise<void> => {
    setIsSaving(true);

    const refused = draft.photo === null ? null : await uploadHouseholdPhoto(draft.photo);
    const saved =
      refused === null
        ? await saveHousehold({
            colour: draft.colour,
            ...(draft.avatar.kind === 'drawn' ? { avatar: draft.avatar } : {}),
          })
        : null;

    setIsSaving(false);

    if (refused !== null || saved === null) {
      notify.failed(refused ?? say('common.thoseChangesWereNotSaved'));

      return;
    }

    onSaved();
  };

  return (
    <Dialog label={say('screens.accountFaceCard.accountPicture')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title={say('screens.accountFaceCard.accountPicture')}
        detail={say('screens.accountFaceCard.showsInsteadOfYourProfilePicture')}
        size="compact"
      />

      <DialogContent>
        <AccountAvatarPicker
          accountId={seed}
          face={household}
          draft={draft}
          onDraft={(changes) => {
            setDraft((held) => ({ ...held, ...changes }));
          }}
          isOwnAccount
        />
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('common.save'),
          isLoading: isSaving,
          onChoose: () => {
            void save();
          },
        }}
      />
    </Dialog>
  );
};

AccountPictureDialog.displayName = 'AccountPictureDialog';

export { AccountPictureDialog };
