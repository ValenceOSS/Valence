import { useState } from 'react';
import { Callout } from '@ValenceUI/Callout';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react/fill';
import { inviteAccount } from '@ValenceClient/admin/fetchAccounts';
import type { AddedAccount } from '@ValenceClient/admin/fetchAccounts';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { DEFAULT_SETUP_LINK_LIFETIME } from '@ValenceContracts/schemas/SetupLink';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { LifetimeChoice } from '@ValenceScreens/components/LifetimeChoice/LifetimeChoice';
import { SetupLinkHandover } from '@ValenceScreens/components/SetupLinkHandover/SetupLinkHandover';
import { UsernameField } from '@ValenceScreens/components/UsernameField/UsernameField';
import type { AddAccountDialogProps } from './AddAccountDialog.types';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import type { z } from 'zod';
import { AddAccountFormSchema } from './AddAccountFormSchema';

const INITIAL: z.input<typeof AddAccountFormSchema> = {
  name: '',
  username: '',
  email: '',
  way: 'link',
  password: '',
  lifetime: DEFAULT_SETUP_LINK_LIFETIME,
};

/**
 * Adds an account in two steps. First who it is for: a name, and any username or address already
 * known, and whether they get a setup link to choose their own way in or a password to be handed.
 * Then, for a link, the link itself to hand over — scanned, copied or emailed.
 *
 * @param isOpen - Whether it is showing.
 * @param canEmailSetupLinks - Whether this server sends setup links by email.
 * @param onClose - Told when it is put away.
 * @param onAdded - Told the account that was added, and its link.
 * @param onEdit - Told to open the account just added in the editor.
 */
const AddAccountDialog = ({
  isOpen,
  canEmailSetupLinks,
  onClose,
  onAdded,
  onEdit,
}: AddAccountDialogProps) => {
  const [isEmailing, setIsEmailing] = useState(false);
  const [added, setAdded] = useState<AddedAccount | null>(null);

  const form = useZodForm(AddAccountFormSchema, INITIAL, async (answers, { reset }) => {
    const outcome = await inviteAccount({
      name: answers.name,
      ...(answers.username === '' ? {} : { username: answers.username }),
      ...(answers.email === '' ? {} : { email: answers.email }),
      ...(answers.way === 'password'
        ? { password: answers.password }
        : { lifetimeDays: answers.lifetime }),
    });

    if (outcome.kind === 'refused') {
      return outcome.refusal?.message ?? say('common.thatCouldNotBeSaved');
    }

    onAdded(outcome.added);
    tellOutcome(
      say('screens.adminArea.accountsPanel.addedInviteName', { inviteName: answers.name }),
      null,
    );

    if (outcome.added.setupLink === null) {
      reset(INITIAL);
      onClose();

      return null;
    }

    setAdded(outcome.added);

    return null;
  });

  const close = () => {
    form.reset(INITIAL);
    setAdded(null);
    onClose();
  };

  const sendByEmail = async () => {
    if (added === null || added.setupLink === null) {
      return;
    }

    setIsEmailing(true);

    const sent = await emailSetupLink(added.account.id, { held: added.setupLink });

    setIsEmailing(false);
    tellOutcome(
      say('screens.addAccountDialog.sentTheLinkToEmail', { email: added.account.email ?? '' }),
      sent.kind === 'refused' ? (sent.refusal?.message ?? null) : null,
    );
  };

  if (added !== null && added.setupLink !== null) {
    const link = added.setupLink;

    return (
      <DialogCompanion
        label={say('screens.addAccountDialog.theirSetupLink')}
        isOpen={isOpen}
        onClose={close}
      >
        <DialogTitle
          size="compact"
          title={say('screens.addAccountDialog.theirSetupLink')}
          detail={say('screens.addAccountDialog.giveThisToNameToSetUp', {
            name: added.account.name,
          })}
        />

        <DialogContent>
          <SetupLinkHandover
            link={link}
            name={added.account.name}
            onEmail={
              canEmailSetupLinks && added.account.email !== null
                ? () => {
                    void sendByEmail();
                  }
                : undefined
            }
            isEmailing={isEmailing}
          />
        </DialogContent>

        <DialogFooter
          dismiss={{
            label: say('screens.adminArea.accountsPanel.editAccount'),
            onChoose: () => {
              const userId = added.account.id;

              close();
              onEdit(userId);
            },
          }}
          confirm={{ label: say('common.done'), onChoose: close }}
        />
      </DialogCompanion>
    );
  }

  return (
    <DialogCompanion
      label={say('screens.addAccountDialog.addAnAccount')}
      isOpen={isOpen}
      onClose={close}
    >
      <DialogTitle
        size="compact"
        title={say('screens.addAccountDialog.addAnAccount')}
        detail={say('screens.addAccountDialog.onlyANameIsNeeded')}
      />

      <Form label={say('screens.addAccountDialog.addAnAccount')} onSubmit={form.submit} isDialog>
        <DialogContent className="flex flex-col gap-4">
          <TextField label={say('common.name')} {...form.text('name')} hasFocusOnMount />

          <UsernameField
            value={form.values.username}
            onValueChange={(next) => {
              form.set('username', next);
            }}
            isOptional
          />

          <TextField
            label={say('screens.addAccountDialog.emailOptional')}
            type="email"
            {...form.text('email')}
          />

          <FormField label={say('screens.addAccountDialog.howTheySignIn')}>
            <SegmentedRow
              label={say('screens.addAccountDialog.howTheySignIn')}
              size="sm"
              value={form.values.way}
              items={[
                { id: 'link', label: say('screens.addAccountDialog.sendThemASetupLink') },
                { id: 'password', label: say('screens.addAccountDialog.giveThemAPassword') },
              ]}
              onSelect={(id) => {
                form.set('way', id === 'password' ? 'password' : 'link');
              }}
            />
          </FormField>

          {form.values.way === 'link' ? (
            <LifetimeChoice
              value={form.values.lifetime}
              onChoose={(next) => {
                form.set('lifetime', next);
              }}
            />
          ) : (
            <TextField
              label={say('common.password')}
              type="password"
              {...form.text('password')}
              autoComplete="new-password"
              description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
            />
          )}

          <p className="text-xs text-text-muted">
            {say('screens.addAccountDialog.theyStartWithTheDefaultRole')}
          </p>

          {form.problem === null ? null : (
            <Callout tone="danger" icon={TriangleAlertIcon} title={form.problem} />
          )}
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: close }}
          confirm={{
            label: say('common.add'),
            isSubmit: true,
            isLoading: form.isSubmitting,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

AddAccountDialog.displayName = 'AddAccountDialog';

export { AddAccountDialog };
