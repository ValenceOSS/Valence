import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import { cn } from '@ValenceUI/cn';
import type { AccountFaceProps } from './AccountFace.types';

/**
 * Draws who an account is in the accounts list: the face its household was given, or where the
 * household has none of its own, the picture of the profile the person made for themselves — an
 * account whose household is left as an initial would otherwise hide the photo they chose.
 *
 * @param account - The account to draw.
 * @param className - Classes for its size, where it is drawn at other than the list's.
 */
const AccountFace = ({ account, className }: AccountFaceProps) => {
  const { face } = account;
  const profile = account.profile ?? null;
  const isHouseholdDrawn = face !== null && face.avatar.kind !== 'initial';

  if (!isHouseholdDrawn && profile !== null) {
    return (
      <FaceCircle
        name={profile.name}
        colour={profile.colour}
        avatar={profile.avatar}
        source={profileAvatarUrl(profile)}
        className={cn('size-8 shrink-0', className)}
      />
    );
  }

  if (face === null) {
    return (
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-text',
          className,
        )}
      >
        {(account.name.trim()[0] ?? '?').toUpperCase()}
      </span>
    );
  }

  return (
    <HouseholdFace
      household={face}
      accountId={account.id}
      className={cn('size-8 shrink-0', className)}
    />
  );
};

AccountFace.displayName = 'AccountFace';

export { AccountFace };
