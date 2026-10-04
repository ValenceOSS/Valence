import { useState } from 'react';
import {
  Link as LinkIcon,
  Mail as MailIcon,
  RefreshCw as RefreshCwIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { issueSetupLink } from '@ValenceClient/admin/issueSetupLink';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { revokeSetupLink } from '@ValenceClient/admin/revokeSetupLink';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { DEFAULT_SETUP_LINK_LIFETIME } from '@ValenceContracts/schemas/SetupLink';
import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import type { Account } from '@ValenceContracts/schemas/Account';
import { say } from '@ValenceI18n/say';
import { LifetimeChoice } from '@ValenceScreens/components/LifetimeChoice/LifetimeChoice';
import { SetupLinkHandover } from '@ValenceScreens/components/SetupLinkHandover/SetupLinkHandover';
import type { SetupLinkSectionProps } from './SetupLinkSection.types';

/**
 * Says where an account stands with its setup link, in words.
 *
 * @param account - The account.
 * @returns The sentence.
 */
const standingOf = (account: Account): string => {
  const until = account.setup.expiresAt === null ? '' : (saidWhen(account.setup.expiresAt) ?? '');

  switch (account.setup.state) {
    case 'waiting':
      return account.canSignIn
        ? say('screens.setupLinkSection.aLinkToChooseANewPasswordWorksUntil', { until })
        : say('screens.setupLinkSection.waitingForNameToSetUpUntil', { name: account.name, until });
    case 'expired':
      return say('screens.setupLinkSection.theirLinkRanOutMakeANewOne');
    case 'used':
    case 'none':
      return account.canSignIn
        ? say('screens.setupLinkSection.sendThemALinkToChooseANewPassword')
        : say('screens.setupLinkSection.theyHaveNoWayToSignInYet');
  }
};

/**
 * The setup link part of the account editor's sign-in tab: where the account stands, the link just
 * made to hand over, and making a new one, emailing it, or stopping it working. For an account
 * already in use a link is the friendlier password reset.
 *
 * @param account - The account.
 * @param held - The link made on this page, which is the only time it can be shown.
 * @param canEmail - Whether this server sends setup links by email.
 * @param onHeld - Told of a link made or forgotten here.
 * @param onChanged - Told that the account's standing changed, to read it again.
 */
const SetupLinkSection = ({
  account,
  held,
  canEmail,
  onHeld,
  onChanged,
}: SetupLinkSectionProps) => {
  const [lifetime, setLifetime] = useState<SetupLinkLifetime>(DEFAULT_SETUP_LINK_LIFETIME);
  const [isMaking, setIsMaking] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const mayEmail = canEmail && account.email !== null;

  const make = async () => {
    setIsMaking(true);

    const made = await issueSetupLink(account.id, lifetime);

    setIsMaking(false);

    if (made.kind === 'answered') {
      onHeld(made.value);
    }

    tellOutcome(
      say('screens.setupLinkSection.madeANewLink'),
      made.kind === 'refused' ? (made.refusal?.message ?? null) : null,
    );
    await onChanged();
  };

  const email = async () => {
    setIsEmailing(true);

    const sent = await emailSetupLink(
      account.id,
      held === null ? { lifetimeDays: lifetime } : { held },
    );

    setIsEmailing(false);

    if (sent.kind === 'answered') {
      onHeld(sent.value);
    }

    tellOutcome(
      say('screens.addAccountDialog.sentTheLinkToEmail', { email: account.email ?? '' }),
      sent.kind === 'refused' ? (sent.refusal?.message ?? null) : null,
    );
    await onChanged();
  };

  const revoke = async () => {
    setIsConfirmingRevoke(false);

    const refusal = await revokeSetupLink(account.id);

    if (refusal === null) {
      onHeld(null);
    }

    tellOutcome(say('screens.setupLinkSection.theLinkNoLongerWorks'), refusal?.message ?? null);
    await onChanged();
  };

  return (
    <FormField
      label={say('screens.adminArea.emailCard.recentEmails.setupLink')}
      description={standingOf(account)}
    >
      <div className="flex flex-col gap-4">
        {held === null ? null : (
          <SetupLinkHandover
            link={held}
            name={account.name}
            onEmail={
              mayEmail
                ? () => {
                    void email();
                  }
                : undefined
            }
            isEmailing={isEmailing}
          />
        )}

        <div className="flex flex-wrap items-end gap-3">
          <LifetimeChoice value={lifetime} onChoose={setLifetime} />

          <Button
            variant="secondary"
            size="sm"
            isLoading={isMaking}
            onClick={() => {
              void make();
            }}
          >
            <Icon of={account.setup.state === 'none' ? LinkIcon : RefreshCwIcon} size={15} />
            {account.setup.state === 'waiting' || held !== null
              ? say('screens.setupLinkSection.newLink')
              : say('screens.setupLinkSection.makeASetupLink')}
          </Button>

          {!mayEmail || held !== null ? null : (
            <Button
              variant="ghost"
              size="sm"
              isLoading={isEmailing}
              onClick={() => {
                void email();
              }}
            >
              <Icon of={MailIcon} size={15} />
              {say('screens.setupLinkHandover.sendByEmail')}
            </Button>
          )}

          {account.setup.state !== 'waiting' ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsConfirmingRevoke(true);
              }}
            >
              {say('common.withdrawIt')}
            </Button>
          )}
        </div>

        {held !== null || account.setup.state !== 'waiting' ? null : (
          <p className="text-xs text-text-muted">
            {say('screens.setupLinkSection.valenceKeepsNoCopyMakeANewOne')}
          </p>
        )}
      </div>

      <ConfirmDialog
        title={say('screens.setupLinkSection.revokeThisLink')}
        detail={say('screens.setupLinkSection.theLinkStopsWorkingAtOnce', { name: account.name })}
        confirmLabel={say('common.withdrawIt')}
        isDestructive
        isOpen={isConfirmingRevoke}
        onClose={() => {
          setIsConfirmingRevoke(false);
        }}
        onConfirm={() => {
          void revoke();
        }}
      />
    </FormField>
  );
};

SetupLinkSection.displayName = 'SetupLinkSection';

export { SetupLinkSection };
