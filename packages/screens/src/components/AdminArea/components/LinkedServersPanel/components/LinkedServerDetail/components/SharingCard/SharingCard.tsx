import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { changeLinkSharing } from '@ValenceClient/admin/changeLinkSharing';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { describeCeiling } from '@ValenceContracts/schemas/LibraryAccess';
import type { LinkSharing, LinkSharingChange } from '@ValenceContracts/schemas/LinkSharing';
import { QUALITY_STEPS, QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import type { SharingCardProps } from './SharingCard.types';
import { say } from '@ValenceI18n/say';

const NO_LIMIT = 'none';

const STREAM_CHOICES = [1, 2, 3, 5, 10] as const;

/**
 * What this server shares with one linked server: which of its libraries, up to what age and
 * whether uncertificated things are let through under it, how many streams at once and how good,
 * whether that server's admin may pause and message this server's people, whether the names of
 * this server's own people travel to that server, and whether that server's admin may read this
 * one's record of their people. Each change is saved as it is made.
 *
 * @param server - The linked server.
 * @param thisServer - What this server is called, as the other one shows it.
 */
const SharingCard = ({ server, thisServer }: SharingCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.linkSharing(server.id));
  const libraries = useQuery(libraryQueries.all());
  const [isSaving, setIsSaving] = useState(false);
  const title = say('screens.adminArea.linkedServersPanel.whatNameCanSee', { name: server.name });

  const change = (next: LinkSharingChange) => {
    setIsSaving(true);

    void changeLinkSharing(server.id, next)
      .then(async (sent) => {
        const isSaved = tellOutcome(
          say('screens.adminArea.linkedServersPanel.savedWhatNameCanSee', { name: server.name }),
          failureOfRefusal(sent.refusal),
        );

        if (isSaved) {
          await cache.invalidateQueries({ queryKey: adminQueries.linkSharing(server.id).queryKey });
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (asked.isError || libraries.isError) {
    return (
      <PanelCard title={title}>
        <CouldNotRead
          said={say('common.thatCouldNotBeRead')}
          isTryingAgain={asked.isFetching || libraries.isFetching}
          onTryAgain={() => {
            void asked.refetch();
            void libraries.refetch();
          }}
        />
      </PanelCard>
    );
  }

  if (asked.isPending || libraries.isPending) {
    return (
      <PanelCard title={title}>
        <Spinner isCentered size="sm" label={say('common.reading')} />
      </PanelCard>
    );
  }

  const sharing: LinkSharing = asked.data;
  const own = libraries.data.filter((library) => (library.linkedServerId ?? null) === null);

  const toggle = (libraryId: string) => {
    change({
      libraryIds: sharing.libraryIds.includes(libraryId)
        ? sharing.libraryIds.filter((id) => id !== libraryId)
        : [...sharing.libraryIds, libraryId],
    });
  };

  return (
    <PanelCard title={title}>
      <div className="flex flex-col gap-4">
        <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {say('screens.adminArea.linkedServersPanel.nothingIsSharedUntilYouChoose')}
        </p>

        {own.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.linkedServersPanel.noLibrariesToShareYet')}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {own.map((library) => {
              const isShared = sharing.libraryIds.includes(library.id);

              return (
                <li key={library.id}>
                  <Button
                    variant={isShared ? 'glossy' : 'ghost'}
                    size="sm"
                    aria-pressed={isShared}
                    disabled={isSaving}
                    label={say('screens.adminArea.linkedServersPanel.shareNameWithName2', {
                      name: library.name,
                      name2: server.name,
                    })}
                    onClick={() => {
                      toggle(library.id);
                    }}
                  >
                    {library.name}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <OptionMenu
            label={say('screens.adminArea.linkedServersPanel.ageLimitForName', {
              name: server.name,
            })}
            groups={[
              {
                name: say('common.nothingAbove'),
                selectedId: sharing.maximumAge === null ? 'none' : String(sharing.maximumAge),
                onSelect: (id) => {
                  change({ maximumAge: id === 'none' ? null : Number.parseInt(id, 10) });
                },
                options: AGE_CHOICES,
              },
            ]}
            trigger={
              <>
                <span className="truncate">{describeCeiling(sharing.maximumAge)}</span>

                <Icon of={ChevronsUpDownIcon} size={14} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="start"
            className="w-40 max-w-full"
          />

          {sharing.maximumAge === null ? null : (
            <Button
              variant={sharing.allowsUnrated ? 'glossy' : 'ghost'}
              size="sm"
              aria-pressed={sharing.allowsUnrated}
              disabled={isSaving}
              label={say('screens.adminArea.linkedServersPanel.allowUncertificatedThingsForName', {
                name: server.name,
              })}
              onClick={() => {
                change({ allowsUnrated: !sharing.allowsUnrated });
              }}
            >
              {say('common.allowUnrated')}
            </Button>
          )}
        </div>

        <SettingList>
          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.streamsAtOnce')}
            description={say('screens.adminArea.linkedServersPanel.howManyOfNamesPeopleMayWatch', {
              name: server.name,
            })}
          >
            <OptionMenu
              label={say('screens.adminArea.linkedServersPanel.streamsAtOnceForName', {
                name: server.name,
              })}
              groups={[
                {
                  name: say('screens.adminArea.linkedServersPanel.streamsAtOnce'),
                  selectedId: sharing.mostStreams === null ? NO_LIMIT : String(sharing.mostStreams),
                  onSelect: (id) => {
                    change({ mostStreams: id === NO_LIMIT ? null : Number.parseInt(id, 10) });
                  },
                  options: [
                    { id: NO_LIMIT, label: say('common.noLimit') },
                    ...STREAM_CHOICES.map((count) => ({ id: String(count), label: String(count) })),
                  ],
                },
              ]}
              trigger={
                <>
                  <span className="truncate">
                    {sharing.mostStreams === null
                      ? say('common.noLimit')
                      : String(sharing.mostStreams)}
                  </span>

                  <Icon of={ChevronsUpDownIcon} size={14} className="shrink-0" />
                </>
              }
              triggerShape="field"
              align="end"
              className="w-32 max-w-full"
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.highestQuality')}
            description={say('screens.adminArea.linkedServersPanel.theBestNamesPeopleAreSent', {
              name: server.name,
            })}
          >
            <OptionMenu
              label={say('screens.adminArea.linkedServersPanel.highestQualityForName', {
                name: server.name,
              })}
              groups={[
                {
                  name: say('screens.adminArea.linkedServersPanel.highestQuality'),
                  selectedId: sharing.qualityCeiling ?? NO_LIMIT,
                  onSelect: (id) => {
                    change({ qualityCeiling: QualityStepIdSchema.safeParse(id).data ?? null });
                  },
                  options: [
                    { id: NO_LIMIT, label: say('common.noLimit') },
                    ...QUALITY_STEPS.map((step) => ({ id: step.id, label: step.label })),
                  ],
                },
              ]}
              trigger={
                <>
                  <span className="truncate">
                    {QUALITY_STEPS.find((step) => step.id === sharing.qualityCeiling)?.label ??
                      say('common.noLimit')}
                  </span>

                  <Icon of={ChevronsUpDownIcon} size={14} className="shrink-0" />
                </>
              }
              triggerShape="field"
              align="end"
              className="w-32 max-w-full"
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.takeTheirRequests')}
            description={say('screens.adminArea.linkedServersPanel.namesPeopleMayAskThisServer', {
              name: server.name,
            })}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.takeTheirRequests')}
              isLabelHidden
              isOn={sharing.takesTheirRequests}
              disabled={isSaving}
              onToggle={() => {
                change({ takesTheirRequests: !sharing.takesTheirRequests });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.playStraightFromThem')}
            description={say('screens.adminArea.linkedServersPanel.playersFetchFromNameDirectly', {
              name: server.name,
            })}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.playStraightFromThem')}
              isLabelHidden
              isOn={sharing.playsDirect}
              disabled={isSaving}
              onToggle={() => {
                change({ playsDirect: !sharing.playsDirect });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.letThemKeepTitlesOffline')}
            description={say('screens.adminArea.linkedServersPanel.namesPeopleMayDownloadWhatIs', {
              name: server.name,
            })}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.letThemKeepTitlesOffline')}
              isLabelHidden
              isOn={sharing.allowsDownloads}
              disabled={isSaving}
              onToggle={() => {
                change({ allowsDownloads: !sharing.allowsDownloads });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.letTheirAdminPauseAndMessage')}
            description={say(
              'screens.adminArea.linkedServersPanel.namesAdminCanPauseSomebodyHere',
              {
                name: server.name,
              },
            )}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.letTheirAdminPauseAndMessage')}
              isLabelHidden
              isOn={sharing.takesTheirControls}
              disabled={isSaving}
              onToggle={() => {
                change({ takesTheirControls: !sharing.takesTheirControls });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.sendYourPeoplesNames')}
            description={say('screens.adminArea.linkedServersPanel.nameSeesWhoIsWatchingByName', {
              name: server.name,
              server: thisServer,
            })}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.sendYourPeoplesNames')}
              isLabelHidden
              isOn={sharing.namesTravel}
              disabled={isSaving}
              onToggle={() => {
                change({ namesTravel: !sharing.namesTravel });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.showThemTheirRecord')}
            description={say('screens.adminArea.linkedServersPanel.letsNamesAdminReadWhatTheir', {
              name: server.name,
            })}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.showThemTheirRecord')}
              isLabelHidden
              isOn={sharing.showsActivity}
              disabled={isSaving}
              onToggle={() => {
                change({ showsActivity: !sharing.showsActivity });
              }}
            />
          </SettingRow>
        </SettingList>
      </div>
    </PanelCard>
  );
};

SharingCard.displayName = 'SharingCard';

export { SharingCard };
