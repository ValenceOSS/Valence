import { useState } from 'react';
import { Plus as PlusFilledIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { MOST_PROFILES } from '@ValenceContracts/constants/MOST_PROFILES';
import { colourOfTheNextProfile } from '@ValenceContracts/functions/colourOfTheNextProfile';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import type { ProfileRosterProps } from './ProfileRoster.types';
import { say } from '@ValenceI18n/say';

/**
 * The profiles on an account, each with what sets it apart — the owner, a PIN, no requests — and a
 * way to add another until the account is full; wherever profiles are listed, they read the same.
 *
 * @param profiles - The profiles, owner first.
 * @param menuFor - What may be done to a profile, drawn at the end of its row, where anything may.
 * @param onAdd - Adds a profile with the name and colour given, saying whether it was added.
 */
const ProfileRoster = ({ profiles, menuFor, onAdd }: ProfileRosterProps) => {
  const [newcomer, setNewcomer] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const add = async () => {
    const wanted = newcomer.trim();

    if (wanted === '') {
      return;
    }

    setIsAdding(true);

    const isAdded = await onAdd(wanted, colourOfTheNextProfile(profiles.length));

    setIsAdding(false);

    if (isAdded) {
      setNewcomer('');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-hover)] in-[.valence-card-face]:rounded-none in-[.valence-card-face]:bg-transparent">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className={cn(
              'flex items-center gap-3 border-b border-[var(--surface-line)] py-2 pl-3 last:border-b-0 in-[.valence-card-face]:border-[var(--surface-card-line)] in-[.valence-card-face]:pl-4 in-[.valence-card-face]:last:border-b',
              menuFor === undefined ? 'pr-3' : 'pr-1.5',
            )}
          >
            <ProfileFace profile={profile} className="size-8 shrink-0 text-xs" />

            <span className="min-w-0 flex-1 truncate text-sm text-text">{profile.name}</span>

            <span className="flex shrink-0 flex-wrap items-center gap-1.5">
              {profile.isOwner ? (
                <Badge size="sm">{say('screens.householdProfiles.owner')}</Badge>
              ) : null}

              {profile.hasPin ? <Badge size="sm">{say('screens.whoIsWatching.pin')}</Badge> : null}

              {profile.isOwner || profile.mayRequest ? null : (
                <Badge size="sm">{say('screens.householdProfiles.noRequests')}</Badge>
              )}
            </span>

            {menuFor?.(profile)}
          </li>
        ))}
      </ul>

      {profiles.length >= MOST_PROFILES ? (
        <p className="text-xs text-text-muted in-[.valence-card-face]:px-4 in-[.valence-card-face]:pb-4 in-[.valence-card-face]:pt-1">
          {say('screens.householdProfiles.anAccountHoldsSixProfiles')}
        </p>
      ) : (
        <form
          noValidate
          className="flex items-start gap-2 in-[.valence-card-face]:px-3 in-[.valence-card-face]:pb-3 in-[.valence-card-face]:pt-1"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <TextField
            label={say('screens.setupWizard.householdStep.addSomebody')}
            isLabelHidden
            value={newcomer}
            onValueChange={setNewcomer}
            placeholder={say('common.name')}
            autoComplete="off"
            className="min-w-0 flex-1"
          />

          <Button
            type="submit"
            variant="secondary"
            isLoading={isAdding}
            disabled={newcomer.trim() === ''}
          >
            <Icon of={PlusFilledIcon} size={16} />
            {say('common.add')}
          </Button>
        </form>
      )}
    </div>
  );
};

ProfileRoster.displayName = 'ProfileRoster';

export { ProfileRoster };
