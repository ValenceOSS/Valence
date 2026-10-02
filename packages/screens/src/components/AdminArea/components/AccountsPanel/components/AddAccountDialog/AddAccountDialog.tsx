import { useState } from 'react';
import { Callout } from '@ValenceUI/Callout';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react';
import { inviteAccount } from '@ValenceClient/admin/fetchAccounts';
import type { AddedAccount } from '@ValenceClient/admin/fetchAccounts';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { DEFAULT_SETUP_LINK_LIFETIME, UsernameSchema } from '@ValenceContracts/schemas/SetupLink';
import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { LifetimeChoice } from '@ValenceScreens/components/LifetimeChoice/LifetimeChoice';
import { SetupLinkHandover } from '@ValenceScreens/components/SetupLinkHandover/SetupLinkHandover';
import { UsernameField } from '@ValenceScreens/components/UsernameField/UsernameField';
import type { AddAccountDialogProps } from './AddAccountDialog.types';

type SignInWay = 'link' | 'password';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [way, setWay] = useState<SignInWay>('link');
  const [password, setPassword] = useState('');
  const [lifetime, setLifetime] = useState<SetupLinkLifetime>(DEFAULT_SETUP_LINK_LIFETIME);
  const [problem, setProblem] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [added, setAdded] = useState<AddedAccount | null>(null);

  const close = () => {
    setName('');
    setUsername('');
    setEmail('');
    setWay('link');
    setPassword('');
    setLifetime(DEFAULT_SETUP_LINK_LIFETIME);
    setProblem(null);
    setAdded(null);
    onClose();
  };

  const wantedUsername = username.trim();
  const wantedEmail = email.trim();
  const isReady =
    name.trim() !== '' &&
    (wantedUsername === '' || UsernameSchema.safeParse(wantedUsername).success) &&
    (wantedEmail === '' || EMAIL_PATTERN.test(wantedEmail)) &&
    (way === 'link' || password.length >= MINIMUM_PASSWORD_LENGTH);

  const add = async () => {
    if (isAdding) {
      return;
    }

    setIsAdding(true);
    setProblem(null);

    const outcome = await inviteAccount({
      name: name.trim(),
      ...(wantedUsername === '' ? {} : { username: wantedUsername }),
      ...(wantedEmail === '' ? {} : { email: wantedEmail }),
      ...(way === 'password' ? { password } : { lifetimeDays: lifetime }),
    });

    setIsAdding(false);

    if (outcome.kind === 'refused') {
      setProblem(outcome.refusal?.message ?? null);

      return;
    }

    onAdded(outcome.added);
    tellOutcome(
      say('screens.adminArea.accountsPanel.addedInviteName', { inviteName: name.trim() }),
      null,
    );

    if (outcome.added.setupLink === null) {
      close();

      return;
    }

    setAdded(outcome.added);
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

      <DialogContent className="flex flex-col gap-4">
        <TextField
          label={say('common.name')}
          value={name}
          onValueChange={setName}
          hasFocusOnMount
        />

        <UsernameField value={username} onValueChange={setUsername} isOptional />

        <TextField
          label={say('screens.addAccountDialog.emailOptional')}
          type="email"
          value={email}
          onValueChange={setEmail}
          {...(wantedEmail !== '' && !EMAIL_PATTERN.test(wantedEmail)
            ? { error: say('screens.addAccountDialog.thatIsNotAnEmailAddress') }
            : {})}
        />

        <FormField label={say('screens.addAccountDialog.howTheySignIn')}>
          <SegmentedRow
            label={say('screens.addAccountDialog.howTheySignIn')}
            size="sm"
            value={way}
            items={[
              { id: 'link', label: say('screens.addAccountDialog.sendThemASetupLink') },
              { id: 'password', label: say('screens.addAccountDialog.giveThemAPassword') },
            ]}
            onSelect={(id) => {
              setWay(id === 'password' ? 'password' : 'link');
            }}
          />
        </FormField>

        {way === 'link' ? (
          <LifetimeChoice value={lifetime} onChoose={setLifetime} />
        ) : (
          <TextField
            label={say('common.password')}
            type="password"
            value={password}
            onValueChange={setPassword}
            autoComplete="new-password"
            description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
          />
        )}

        <p className="text-xs text-text-muted">
          {say('screens.addAccountDialog.theyStartWithTheDefaultRole')}
        </p>

        {problem === null ? null : (
          <Callout tone="danger" icon={TriangleAlertIcon} title={problem} />
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: close }}
        confirm={{
          label: say('common.add'),
          onChoose: () => {
            void add();
          },
          isLoading: isAdding,
          isDisabled: !isReady,
        }}
      />
    </DialogCompanion>
  );
};

AddAccountDialog.displayName = 'AddAccountDialog';

export { AddAccountDialog };
