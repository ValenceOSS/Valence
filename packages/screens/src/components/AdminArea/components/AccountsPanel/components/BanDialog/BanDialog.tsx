import { useEffect, useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { say } from '@ValenceI18n/say';
import type { BanDialogProps } from './BanDialog.types';

const MOST_REASON_CHARACTERS = 200;

/**
 * Asks before banning somebody, and why: the reason is what they are told when they next try to
 * sign in, and what the accounts list shows beneath the ban.
 *
 * @param name - Who is to be banned, or null while nobody is.
 * @param onClose - Told when it is dismissed.
 * @param onBan - Told to ban them, with the reason.
 */
const BanDialog = ({ name, onClose, onBan }: BanDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason(say('screens.adminArea.accountsPanel.bannedFromTheAdminArea'));
  }, [name]);

  const trimmed = reason.trim();

  return (
    <DialogCompanion
      label={say('screens.adminArea.accountsPanel.banThisAccount')}
      isOpen={name !== null}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.accountsPanel.banThisAccount')}
        detail={say('screens.adminArea.accountsPanel.nameWillBeSignedOutAnd', { name: name ?? '' })}
      />

      <DialogContent>
        <TextField
          label={say('screens.banDialog.whatTheyAreTold')}
          value={reason}
          onValueChange={setReason}
          {...(reason.length > MOST_REASON_CHARACTERS
            ? { error: say('screens.banDialog.keepItShorter') }
            : {})}
        />
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.adminArea.accountsPanel.ban'),
          isDestructive: true,
          isDisabled: trimmed === '' || reason.length > MOST_REASON_CHARACTERS,
          onChoose: () => {
            onBan(trimmed);
          },
        }}
      />
    </DialogCompanion>
  );
};

BanDialog.displayName = 'BanDialog';

export { BanDialog };
