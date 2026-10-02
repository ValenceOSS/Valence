import { Badge } from '@ValenceUI/Badge';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import { say } from '@ValenceI18n/say';
import { describeLinkLife } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/describeLinkLife';
import { accountStandingOf } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/accountStandingOf';
import type { AccountStandingKind } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/accountStandingOf';
import type { AccountStandingProps } from './AccountStanding.types';

const TONES: Record<AccountStandingKind, BadgeTone> = {
  banned: 'solid',
  waiting: 'accent',
  expired: 'warning',
  cannotSignIn: 'warning',
  active: 'quiet',
};

/**
 * Names the standing an account is in.
 *
 * @param kind - The standing.
 * @returns Its name.
 */
const nameOf = (kind: AccountStandingKind): string => {
  switch (kind) {
    case 'banned':
      return say('screens.adminArea.accountsPanel.banned');
    case 'waiting':
      return say('screens.accountStanding.waitingForSetup');
    case 'expired':
      return say('screens.accountStanding.linkExpired');
    case 'cannotSignIn':
      return say('screens.accountStanding.cannotSignInYet');
    case 'active':
      return say('screens.accountStanding.active');
  }
};

/**
 * Shows where an account stands — in use, waiting for its owner to set it up, its link run out,
 * unable to be signed in to, or banned — with, beneath it, how long a link has left or why a ban
 * was made.
 *
 * @param account - The account.
 * @param now - The moment to measure a link's life from.
 * @param hasDetail - Whether to say more beneath the badge.
 */
const AccountStanding = ({ account, now, hasDetail = true }: AccountStandingProps) => {
  const kind = accountStandingOf(account);
  const expiresAt = account.setup.expiresAt;
  const detail = !hasDetail
    ? null
    : kind === 'banned'
      ? account.banReason
      : account.setup.state === 'waiting' && expiresAt !== null
        ? describeLinkLife(expiresAt, now)
        : null;

  return (
    <span className="flex min-w-0 flex-col items-start gap-1">
      <Badge size="sm" tone={TONES[kind]}>
        {nameOf(kind)}
      </Badge>

      {detail === null ? null : <span className="truncate text-xs text-text-muted">{detail}</span>}
    </span>
  );
};

AccountStanding.displayName = 'AccountStanding';

export { AccountStanding };
