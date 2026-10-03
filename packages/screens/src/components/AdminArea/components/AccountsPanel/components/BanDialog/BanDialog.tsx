import { useEffect } from 'react';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import { BanFormSchema } from './BanFormSchema';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { say } from '@ValenceI18n/say';
import type { BanDialogProps } from './BanDialog.types';

/**
 * Asks before banning somebody, and why: the reason is what they are told when they next try to
 * sign in, and what the accounts list shows beneath the ban.
 *
 * @param name - Who is to be banned, or null while nobody is.
 * @param onClose - Told when it is dismissed.
 * @param onBan - Told to ban them, with the reason.
 */
const BanDialog = ({ name, onClose, onBan }: BanDialogProps) => {
  const form = useZodForm(BanFormSchema, { reason: '' }, (answers) => {
    onBan(answers.reason);

    return null;
  });

  const { reset } = form;

  useEffect(() => {
    reset({ reason: say('screens.adminArea.accountsPanel.bannedFromTheAdminArea') });
  }, [name, reset]);

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

      <Form
        label={say('screens.adminArea.accountsPanel.banThisAccount')}
        onSubmit={form.submit}
        isDialog
      >
        <DialogContent>
          <TextField label={say('screens.banDialog.whatTheyAreTold')} {...form.text('reason')} />
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: say('screens.adminArea.accountsPanel.ban'),
            isDestructive: true,
            isSubmit: true,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

BanDialog.displayName = 'BanDialog';

export { BanDialog };
