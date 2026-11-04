import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { SelectField } from '@ValenceUI/SelectField';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { PanelCard } from '@ValenceUI/PanelCard';
import { changeLinkSharing } from '@ValenceClient/admin/changeLinkSharing';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
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

  const head = (text: string, isFirst = false) => (
    <h3
      className={
        isFirst
          ? 'px-5 pt-4 text-xs font-medium text-text-muted'
          : 'border-t border-[var(--surface-line)] px-5 pt-4 text-xs font-medium text-text-muted'
      }
    >
      {text}
    </h3>
  );

  const toggleRow = (
    titleText: string,
    description: string,
    isOn: boolean,
    onToggle: () => void,
    detail?: string,
  ) => (
    <SettingRow
      title={titleText}
      description={description}
      {...(detail === undefined
        ? {}
        : {
            info: (
              <PanelCardInfo
                label={say('common.aboutName', { name: titleText })}
                detail={detail}
                align="start"
              />
            ),
          })}
    >
      <Switch label={titleText} isLabelHidden isOn={isOn} disabled={isSaving} onToggle={onToggle} />
    </SettingRow>
  );

  return (
    <PanelCard
      title={title}
      isFlush
      actions={
        <PanelCardInfo
          label={say('screens.adminArea.statStrip.aboutLabel', { label: title })}
          detail={say('screens.adminArea.linkedServersPanel.nothingIsSharedUntilYouChoose')}
        />
      }
    >
      {head(say('common.libraries'), true)}
      <div className="px-5 pt-3 pb-1">
        {own.length === 0 ? (
          <p className="text-[0.8125rem] text-text-muted">
            {say('screens.adminArea.linkedServersPanel.noLibrariesToShareYet')}
          </p>
        ) : (
          <LibraryPicker
            libraries={own}
            chosen={new Set(sharing.libraryIds)}
            onChange={(chosen) => {
              change({ libraryIds: [...chosen] });
            }}
          />
        )}
      </div>
      <SettingList isInset>
        <SettingRow
          title={say('screens.adminArea.linkedServersPanel.ageLimit')}
          description={say('screens.adminArea.linkedServersPanel.titlesRatedAboveThisStayHidden')}
        >
          <SelectField
            label={say('screens.adminArea.linkedServersPanel.ageLimitForName', {
              name: server.name,
            })}
            isLabelHidden
            size="sm"
            className="w-56 max-w-full"
            options={AGE_CHOICES}
            value={sharing.maximumAge === null ? 'none' : String(sharing.maximumAge)}
            onSelect={(id) => {
              change({ maximumAge: id === 'none' ? null : Number.parseInt(id, 10) });
            }}
          />
        </SettingRow>
        {sharing.maximumAge === null
          ? null
          : toggleRow(
              say('common.allowUnrated'),
              say('screens.adminArea.linkedServersPanel.letsThroughTitlesWithNoAgeRating'),
              sharing.allowsUnrated,
              () => {
                change({ allowsUnrated: !sharing.allowsUnrated });
              },
            )}
      </SettingList>

      {head(say('screens.adminArea.linkedServersPanel.howTheyWatch'))}
      <SettingList isInset>
        <SettingRow
          title={say('screens.adminArea.linkedServersPanel.streamsAtOnce')}
          description={say('screens.adminArea.linkedServersPanel.howManyOfTheirPeopleCanWatch')}
        >
          <SelectField
            label={say('screens.adminArea.linkedServersPanel.streamsAtOnceForName', {
              name: server.name,
            })}
            isLabelHidden
            size="sm"
            className="w-56 max-w-full"
            options={[
              { id: NO_LIMIT, label: say('common.noLimit') },
              ...STREAM_CHOICES.map((count) => ({ id: String(count), label: String(count) })),
            ]}
            value={sharing.mostStreams === null ? NO_LIMIT : String(sharing.mostStreams)}
            onSelect={(id) => {
              change({ mostStreams: id === NO_LIMIT ? null : Number.parseInt(id, 10) });
            }}
          />
        </SettingRow>
        <SettingRow
          title={say('screens.adminArea.linkedServersPanel.highestQuality')}
          description={say('screens.adminArea.linkedServersPanel.theBestQualityTheyreSent')}
        >
          <SelectField
            label={say('screens.adminArea.linkedServersPanel.highestQualityForName', {
              name: server.name,
            })}
            isLabelHidden
            size="sm"
            className="w-56 max-w-full"
            options={[
              { id: NO_LIMIT, label: say('common.noLimit') },
              ...QUALITY_STEPS.map((step) => ({ id: step.id, label: step.label })),
            ]}
            value={sharing.qualityCeiling ?? NO_LIMIT}
            onSelect={(id) => {
              change({ qualityCeiling: QualityStepIdSchema.safeParse(id).data ?? null });
            }}
          />
        </SettingRow>
        {toggleRow(
          say('screens.adminArea.linkedServersPanel.playStraightFromThem'),
          say('screens.adminArea.linkedServersPanel.theirPlayersFetchTitlesFromThem'),
          sharing.playsDirect,
          () => {
            change({ playsDirect: !sharing.playsDirect });
          },
          say('screens.adminArea.linkedServersPanel.playersFetchFromNameDirectly', {
            name: server.name,
          }),
        )}
        {toggleRow(
          say('screens.adminArea.linkedServersPanel.letThemKeepTitlesOffline'),
          say('screens.adminArea.linkedServersPanel.namesPeopleMayDownloadWhatIs', {
            name: server.name,
          }),
          sharing.allowsDownloads,
          () => {
            change({ allowsDownloads: !sharing.allowsDownloads });
          },
        )}
      </SettingList>

      {head(say('screens.adminArea.linkedServersPanel.betweenTheServers'))}
      <SettingList isInset>
        {toggleRow(
          say('screens.adminArea.linkedServersPanel.takeTheirRequests'),
          say('screens.adminArea.linkedServersPanel.theirRequestsJoinYourQueue'),
          sharing.takesTheirRequests,
          () => {
            change({ takesTheirRequests: !sharing.takesTheirRequests });
          },
          say('screens.adminArea.linkedServersPanel.namesPeopleMayAskThisServer', {
            name: server.name,
          }),
        )}
        {toggleRow(
          say('screens.adminArea.linkedServersPanel.letTheirAdminPauseAndMessage'),
          say('screens.adminArea.linkedServersPanel.theirAdminCanPauseOrMessage'),
          sharing.takesTheirControls,
          () => {
            change({ takesTheirControls: !sharing.takesTheirControls });
          },
          say('screens.adminArea.linkedServersPanel.namesAdminCanPauseSomebodyHere', {
            name: server.name,
          }),
        )}
        {toggleRow(
          say('screens.adminArea.linkedServersPanel.sendYourPeoplesNames'),
          say('screens.adminArea.linkedServersPanel.nameSeesWhoIsWatchingByName', {
            name: server.name,
            server: thisServer,
          }),
          sharing.namesTravel,
          () => {
            change({ namesTravel: !sharing.namesTravel });
          },
        )}
        {toggleRow(
          say('screens.adminArea.linkedServersPanel.showThemTheirRecord'),
          say('screens.adminArea.linkedServersPanel.letsNamesAdminReadWhatTheir', {
            name: server.name,
          }),
          sharing.showsActivity,
          () => {
            change({ showsActivity: !sharing.showsActivity });
          },
        )}
      </SettingList>
    </PanelCard>
  );
};

SharingCard.displayName = 'SharingCard';

export { SharingCard };
