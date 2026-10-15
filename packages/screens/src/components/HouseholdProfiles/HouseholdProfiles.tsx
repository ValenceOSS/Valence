import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown as CrownFilledIcon,
  Lock as LockFilledIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pen as PenFilledIcon,
  Bin as BinFilledIcon,
  Plus as PlusFilledIcon,
  Film as FilmFilledIcon,
  Unlock as UnlockFilledIcon,
  Inbox as InboxFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { ProfileLimitsDialog } from './components/ProfileLimitsDialog/ProfileLimitsDialog';
import { ProfileNameDialog } from './components/ProfileNameDialog/ProfileNameDialog';
import { ProfilePinDialog } from './components/ProfilePinDialog/ProfilePinDialog';
import type { HouseholdProfilesProps } from './HouseholdProfiles.types';
import { say } from '@ValenceI18n/say';

const MOST_PROFILES = 6;

/**
 * The profiles on an account, and everything its owner — or an administrator — may do to them:
 * add, rename and remove them, give each a PIN, stop one asking for things, narrow what one may
 * watch, and hand the account to another. The owner's own profile can be neither removed nor
 * limited, only handed on.
 *
 * @param accountId - Whose account, where an administrator is managing somebody else's.
 */
const HouseholdProfiles = ({ accountId }: HouseholdProfilesProps) => {
  const cache = useQueryClient();
  const list = useQuery(profileQueries.list(accountId));
  const [newcomer, setNewcomer] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [renaming, setRenaming] = useState<ViewerProfile | null>(null);
  const [locking, setLocking] = useState<ViewerProfile | null>(null);
  const [limiting, setLimiting] = useState<ViewerProfile | null>(null);
  const [removing, setRemoving] = useState<ViewerProfile | null>(null);
  const [handing, setHanding] = useState<ViewerProfile | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const act = async (change: Omit<Parameters<typeof changeProfiles>[0], 'accountId'>) => {
    const refused = await changeProfiles({
      ...change,
      ...(accountId === undefined ? {} : { accountId }),
    });

    if (refused !== null) {
      notify.failed(refused);

      return false;
    }

    await cache.invalidateQueries({ queryKey: profileQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });

    return true;
  };

  if (list.isError) {
    return (
      <CouldNotRead
        said={say('screens.householdProfiles.theProfilesCouldNotBeRead')}
        isTryingAgain={list.isFetching}
        onTryAgain={() => {
          void list.refetch();
        }}
      />
    );
  }

  if (list.data === undefined) {
    return <Spinner size="sm" label={say('common.loading')} />;
  }

  const { profiles } = list.data;

  const add = async () => {
    const wanted = newcomer.trim();

    if (wanted === '') {
      return;
    }

    setIsAdding(true);

    const isAdded = await act({
      path: '',
      method: 'POST',
      body: {
        name: wanted,
        colour: PROFILE_COLOURS[profiles.length % PROFILE_COLOURS.length] ?? PROFILE_COLOURS[0],
      },
    });

    setIsAdding(false);

    if (isAdded) {
      setNewcomer('');
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-text-muted">
        {accountId === undefined
          ? say('screens.householdProfiles.eachProfileKeepsItsOwn')
          : say('screens.householdProfiles.theProfilesOnThisAccount')}
      </p>

      <ul className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-hover)]">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className="flex items-center gap-3 border-b border-[var(--surface-line)] py-2 pl-3 pr-1.5 last:border-b-0"
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

            <ActionMenu
              label={say('common.changeName', { name: profile.name })}
              align="end"
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'rename',
                      label: say('common.rename'),
                      icon: <Icon of={PenFilledIcon} size={16} />,
                      onChoose: () => {
                        setRenaming(profile);
                      },
                    },
                    {
                      id: 'pin',
                      label: profile.hasPin
                        ? say('screens.householdProfiles.changeThePin')
                        : say('screens.householdProfiles.setAPin'),
                      icon: <Icon of={LockFilledIcon} size={16} />,
                      onChoose: () => {
                        setLocking(profile);
                      },
                    },
                    ...(profile.hasPin
                      ? [
                          {
                            id: 'unpin',
                            label: say('screens.householdProfiles.removeThePin'),
                            icon: <Icon of={UnlockFilledIcon} size={16} />,
                            onChoose: () => {
                              void act({
                                path: `/${profile.id}/pin`,
                                method: 'PUT',
                                body: { pin: null },
                              });
                            },
                          },
                        ]
                      : []),
                  ],
                },
                ...(profile.isOwner
                  ? []
                  : [
                      {
                        items: [
                          {
                            id: 'requests',
                            label: profile.mayRequest
                              ? say('screens.householdProfiles.stopRequests')
                              : say('screens.householdProfiles.allowRequests'),
                            icon: <Icon of={InboxFilledIcon} size={16} />,
                            onChoose: () => {
                              void act({
                                path: `/${profile.id}/may-request`,
                                method: 'PUT',
                                body: { mayRequest: !profile.mayRequest },
                              });
                            },
                          },
                          {
                            id: 'limits',
                            label: say('screens.householdProfiles.librariesAndAges'),
                            icon: <Icon of={FilmFilledIcon} size={16} />,
                            onChoose: () => {
                              setLimiting(profile);
                            },
                          },
                          {
                            id: 'owner',
                            label: say('screens.householdProfiles.makeOwner'),
                            icon: <Icon of={CrownFilledIcon} size={16} />,
                            onChoose: () => {
                              setHanding(profile);
                            },
                          },
                        ],
                      },
                      {
                        items: [
                          {
                            id: 'remove',
                            label: say('common.forget'),
                            icon: <Icon of={BinFilledIcon} size={16} />,
                            isDestructive: true,
                            onChoose: () => {
                              setRemoving(profile);
                            },
                          },
                        ],
                      },
                    ]),
              ]}
            />
          </li>
        ))}
      </ul>

      {profiles.length >= MOST_PROFILES ? (
        <p className="text-xs text-text-muted">
          {say('screens.householdProfiles.anAccountHoldsSixProfiles')}
        </p>
      ) : (
        <form
          noValidate
          className="flex items-start gap-2"
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

      <ProfileNameDialog
        title={say('common.renameName', { name: renaming?.name ?? '' })}
        initialName={renaming?.name ?? ''}
        isOpen={renaming !== null}
        onClose={() => {
          setRenaming(null);
        }}
        onSave={(name) =>
          renaming === null
            ? Promise.resolve(false)
            : act({
                path: `/${renaming.id}`,
                method: 'PATCH',
                body: { name, colour: renaming.colour },
              })
        }
      />

      <ProfilePinDialog
        name={locking?.name ?? ''}
        isOpen={locking !== null}
        onClose={() => {
          setLocking(null);
        }}
        onSave={(pin) =>
          locking === null
            ? Promise.resolve(false)
            : act({ path: `/${locking.id}/pin`, method: 'PUT', body: { pin } })
        }
      />

      <ProfileLimitsDialog
        profile={limiting}
        {...(accountId === undefined ? {} : { accountId })}
        onClose={() => {
          setLimiting(null);
        }}
      />

      <ConfirmDialog
        title={say('common.removeName', { name: removing?.name ?? '' })}
        detail={say('screens.householdProfiles.everythingNameWatchedGoes', {
          name: removing?.name ?? '',
        })}
        confirmLabel={say('common.forget')}
        isDestructive
        isBusy={isBusy}
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          if (removing === null) {
            return;
          }

          setIsBusy(true);
          void act({ path: `/${removing.id}`, method: 'DELETE' }).then(() => {
            setIsBusy(false);
            setRemoving(null);
          });
        }}
      />

      <ConfirmDialog
        title={say('screens.householdProfiles.makeNameTheOwner', { name: handing?.name ?? '' })}
        detail={say('screens.householdProfiles.theOwnerCanChangeTheAccount', {
          name: handing?.name ?? '',
        })}
        confirmLabel={say('screens.householdProfiles.makeOwner')}
        isBusy={isBusy}
        isOpen={handing !== null}
        onClose={() => {
          setHanding(null);
        }}
        onConfirm={() => {
          if (handing === null) {
            return;
          }

          setIsBusy(true);
          void act({ path: `/${handing.id}/owner`, method: 'POST' }).then(() => {
            setIsBusy(false);
            setHanding(null);
          });
        }}
      />
    </section>
  );
};

HouseholdProfiles.displayName = 'HouseholdProfiles';

export { HouseholdProfiles };
