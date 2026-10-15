import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import { LibraryReachList } from '@ValenceScreens/components/LibraryReachList/LibraryReachList';
import type { ProfileLimitsDialogProps } from './ProfileLimitsDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * The ages a profile may be held to in a library: any of them where its account is not held to one
 * there, or only those at or below the account's own, since a profile can only be narrowed.
 *
 * @param shelf - The library, as the profile and its account stand in it.
 * @returns The choices.
 */
const agesFor = (shelf: ProfileLibrary) =>
  AGE_CHOICES.filter(
    (choice) =>
      choice.id === 'none' ||
      shelf.accountMaximumAge === null ||
      Number.parseInt(choice.id, 10) <= shelf.accountMaximumAge,
  );

/**
 * Narrows what one profile may watch: which of its account's libraries it sees, and up to what age
 * in each. Each change is kept as it is made. The account's own limits still apply on top.
 *
 * @param profile - Whose limits, or nobody while it is closed.
 * @param accountId - Whose account, where an administrator is looking at somebody else's.
 * @param onClose - Told to put it away.
 */
const ProfileLimitsDialog = ({ profile, accountId, onClose }: ProfileLimitsDialogProps) => {
  const cache = useQueryClient();
  const [isChanging, setIsChanging] = useState<string | null>(null);
  const shelves = useQuery({
    ...profileQueries.libraries(profile?.id ?? '', accountId),
    enabled: profile !== null,
  });

  const change = async (
    shelf: ProfileLibrary,
    path: string,
    method: 'PUT' | 'DELETE',
    body?: object,
  ) => {
    if (profile === null) {
      return;
    }

    setIsChanging(shelf.id);

    const refused = await changeProfiles({
      path: `/${profile.id}/libraries/${shelf.id}${path}`,
      method,
      ...(body === undefined ? {} : { body }),
      ...(accountId === undefined ? {} : { accountId }),
    });

    setIsChanging(null);

    if (refused !== null) {
      notify.failed(refused);

      return;
    }

    await cache.invalidateQueries({ queryKey: profileQueries.key });
  };

  const keep = (shelf: ProfileLibrary, changes: Partial<LibraryReach>) => {
    if (changes.mayView !== undefined) {
      return change(shelf, '', changes.mayView ? 'PUT' : 'DELETE');
    }

    const maximumAge = changes.maximumAge === undefined ? shelf.maximumAge : changes.maximumAge;

    return maximumAge === null
      ? change(shelf, '/ceiling', 'DELETE')
      : change(shelf, '/ceiling', 'PUT', {
          maximumAge,
          allowsUnrated: changes.allowsUnrated ?? shelf.allowsUnrated,
        });
  };

  const name = profile?.name ?? '';
  const title = say('screens.householdProfiles.whatNameCanWatch', { name });

  return (
    <DialogCompanion label={title} isOpen={profile !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.householdProfiles.eachChangeIsKeptAsYouMakeIt')}
      />

      <DialogContent className="flex flex-col gap-4">
        {shelves.data === undefined ? (
          <Spinner size="sm" label={say('common.loading')} />
        ) : (
          <LibraryReachList
            shelves={shelves.data}
            whose={name}
            agesFor={agesFor}
            changing={isChanging}
            onChange={(shelf, changes) => {
              void keep(shelf, changes);
            }}
          />
        )}

        <p className="text-xs text-text-muted">
          {say('screens.householdProfiles.theAccountsOwnLimitsStillApply')}
        </p>
      </DialogContent>

      <DialogFooter dismiss={{ label: say('common.done'), onChoose: onClose }} />
    </DialogCompanion>
  );
};

ProfileLimitsDialog.displayName = 'ProfileLimitsDialog';

export { ProfileLimitsDialog };
