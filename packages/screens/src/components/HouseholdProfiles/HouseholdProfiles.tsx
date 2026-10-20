import { PanelCard } from '@ValenceUI/PanelCard';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown as CrownFilledIcon,
  Lock as LockFilledIcon,
  Pen as PenFilledIcon,
  Bin as BinFilledIcon,
  Film as FilmFilledIcon,
  Unlock as UnlockFilledIcon,
  Inbox as InboxFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { AccountFaceCard } from './components/AccountFaceCard/AccountFaceCard';
import { ProfileLimitsDialog } from './components/ProfileLimitsDialog/ProfileLimitsDialog';
import { ProfileNameDialog } from './components/ProfileNameDialog/ProfileNameDialog';
import { ProfilePinDialog } from './components/ProfilePinDialog/ProfilePinDialog';
import { ProfileRoster } from '@ValenceScreens/components/ProfileRoster/ProfileRoster';
import type { HouseholdProfilesProps } from './HouseholdProfiles.types';
import { say } from '@ValenceI18n/say';

/**
 * The profiles on an account, and everything its owner — or an administrator — may do to them:
 * add, rename and remove them, give each a PIN, stop one asking for things, narrow what one may
 * watch, and hand the account to another. The owner's own profile can be neither removed nor
 * limited, only handed on. Once more than one person watches, the owner may also give the account a
 * name and picture of its own.
 *
 * @param accountId - Whose account, where an administrator is managing somebody else's.
 */
const HouseholdProfiles = ({ accountId }: HouseholdProfilesProps) => {
  const cache = useQueryClient();
  const list = useQuery(profileQueries.list(accountId));
  const [renaming, setRenaming] = useState<ViewerProfile | null>(null);
  const [locking, setLocking] = useState<ViewerProfile | null>(null);
  const [limiting, setLimiting] = useState<ViewerProfile | null>(null);
  const [removing, setRemoving] = useState<ViewerProfile | null>(null);
  const [handing, setHanding] = useState<ViewerProfile | null>(null);
  const [unpinning, setUnpinning] = useState<ViewerProfile | null>(null);
  const [stopping, setStopping] = useState<ViewerProfile | null>(null);
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
  const owner = profiles.find((profile) => profile.isOwner);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard
        title={say('common.profiles')}
        isFlush
        actions={
          <PanelCardInfo
            label={say('common.aboutName', { name: say('common.profiles') })}
            detail={
              accountId === undefined
                ? say('screens.householdProfiles.eachProfileKeepsItsOwn')
                : say('screens.householdProfiles.theProfilesOnThisAccount')
            }
          />
        }
      >
        <ProfileRoster
          profiles={profiles}
          menuFor={(profile) => (
            <ActionMenu
              label={say('common.changeName', { name: profile.name })}
              align="end"
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
                              setUnpinning(profile);
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
                              if (profile.mayRequest) {
                                setStopping(profile);

                                return;
                              }

                              void act({
                                path: `/${profile.id}/may-request`,
                                method: 'PUT',
                                body: { mayRequest: true },
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
          )}
          onAdd={(name, colour) => act({ path: '', method: 'POST', body: { name, colour } })}
        />

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

        <ConfirmDialog
          title={say('screens.householdProfiles.removeNamesPin', { name: unpinning?.name ?? '' })}
          detail={say('screens.householdProfiles.anybodyCanThenChooseName', {
            name: unpinning?.name ?? '',
          })}
          confirmLabel={say('screens.householdProfiles.removeThePin')}
          isBusy={isBusy}
          isOpen={unpinning !== null}
          onClose={() => {
            setUnpinning(null);
          }}
          onConfirm={() => {
            if (unpinning === null) {
              return;
            }

            setIsBusy(true);
            void act({ path: `/${unpinning.id}/pin`, method: 'PUT', body: { pin: null } }).then(
              () => {
                setIsBusy(false);
                setUnpinning(null);
              },
            );
          }}
        />

        <ConfirmDialog
          title={say('screens.householdProfiles.stopNameRequesting', {
            name: stopping?.name ?? '',
          })}
          detail={say('screens.householdProfiles.nameCanNoLongerAsk', {
            name: stopping?.name ?? '',
          })}
          confirmLabel={say('screens.householdProfiles.stopRequests')}
          isBusy={isBusy}
          isOpen={stopping !== null}
          onClose={() => {
            setStopping(null);
          }}
          onConfirm={() => {
            if (stopping === null) {
              return;
            }

            setIsBusy(true);
            void act({
              path: `/${stopping.id}/may-request`,
              method: 'PUT',
              body: { mayRequest: false },
            }).then(() => {
              setIsBusy(false);
              setStopping(null);
            });
          }}
        />
      </PanelCard>

      {accountId === undefined && owner !== undefined && profiles.length > 1 ? (
        <AccountFaceCard ownerId={owner.id} ownerName={owner.name} />
      ) : null}
    </div>
  );
};

HouseholdProfiles.displayName = 'HouseholdProfiles';

export { HouseholdProfiles };
