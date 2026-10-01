import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Key as KeyIcon } from '@keyline-icons/react';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { changeSeerrLink } from '@ValenceClient/requests/changeSeerrLink';
import { rotateSeerrKey } from '@ValenceClient/requests/rotateSeerrKey';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { CopyableAddress } from '@ValenceScreens/components/CopyableAddress/CopyableAddress';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { seerrServerOf } from './seerrServerOf';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { SeerrLink, SeerrLinkChange } from '@ValenceContracts/schemas/SeerrLink';
import type { SeerrCardProps } from './SeerrCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Overseerr and Jellyseerr, where they are pointed at Valence: Valence answers them as if it were
 * Radarr for films and Sonarr for series, so whoever already asks there can go on doing so and have
 * what they ask for fetched by Valence. Turns that on, makes and remakes the key they send, chooses
 * the account their requests are made as, and says exactly what to type into their dialogs.
 *
 * @param origin - Where Valence is reached from, which the addresses to give them are built on.
 */
const SeerrCard = ({ origin }: SeerrCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(requestsQueries.seerrLink());
  const accounts = useQuery(adminQueries.accounts());
  const [isSaving, setIsSaving] = useState(false);

  const keep = async (sending: Promise<Sent<SeerrLink>>, done: string) => {
    setIsSaving(true);

    const { value, refusal } = await sending;

    setIsSaving(false);

    if (tellOutcome(done, failureOfRefusal(refusal)) && value !== null) {
      cache.setQueryData(requestsQueries.seerrLink().queryKey, value);
    }
  };

  const change = (link: SeerrLink, patch: Partial<SeerrLinkChange>, done: string) => {
    void keep(
      changeSeerrLink({ isEnabled: link.isEnabled, accountId: link.accountId, ...patch }),
      done,
    );
  };

  const link = asked.data;
  const title = say('screens.adminArea.seerrCard.overseerrAndJellyseerr');

  if (asked.isError) {
    return (
      <PanelCard title={title}>
        <CouldNotRead
          said={say('screens.adminArea.seerrCard.theLinkCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </PanelCard>
    );
  }

  if (link === undefined) {
    return (
      <PanelCard title={title}>
        <Spinner isCentered label={say('screens.adminArea.seerrCard.readingTheLink')} size="sm" />
      </PanelCard>
    );
  }

  const choices = [
    { id: '', label: say('screens.adminArea.seerrCard.nobodyYet') },
    ...(accounts.data ?? []).map((account) => ({ id: account.id, label: account.name })),
  ];
  const servers = [
    {
      kind: 'radarr',
      title: say('screens.adminArea.seerrCard.asRadarrForFilms'),
      server: seerrServerOf(origin, link.radarrPath),
    },
    {
      kind: 'sonarr',
      title: say('screens.adminArea.seerrCard.asSonarrForSeries'),
      server: seerrServerOf(origin, link.sonarrPath),
    },
  ] as const;

  return (
    <PanelCard
      title={title}
      actions={
        link.isEnabled ? (
          <PanelCardAction
            icon={KeyIcon}
            isLoading={isSaving}
            onClick={() => {
              void keep(rotateSeerrKey(), say('screens.adminArea.seerrCard.madeANewKey'));
            }}
          >
            {say('screens.adminArea.seerrCard.makeANewKey')}
          </PanelCardAction>
        ) : null
      }
    >
      <div className="flex flex-col gap-5">
        <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {say('screens.adminArea.seerrCard.keepAskingInOverseerrOr')}
        </p>

        {link.isRequestingOn ? (
          <>
            <SettingList>
              <SettingRow
                title={say('screens.adminArea.seerrCard.answerOverseerrAndJellyseerr')}
                description={say('screens.adminArea.seerrCard.valenceAnswersThemAsRadarr')}
              >
                <Switch
                  label={say('screens.adminArea.seerrCard.answerOverseerrAndJellyseerr')}
                  isLabelHidden
                  isOn={link.isEnabled}
                  disabled={isSaving}
                  onToggle={() => {
                    change(
                      link,
                      { isEnabled: !link.isEnabled },
                      link.isEnabled
                        ? say('screens.adminArea.seerrCard.valenceNoLongerAnswersThem')
                        : say('screens.adminArea.seerrCard.valenceNowAnswersThem'),
                    );
                  }}
                />
              </SettingRow>

              <SettingRow
                title={say('screens.adminArea.seerrCard.askAs')}
                description={say('screens.adminArea.seerrCard.everythingTheySendIsAsked')}
              >
                <Choice
                  label={say('screens.adminArea.seerrCard.askAs')}
                  options={choices}
                  value={link.accountId}
                  onSelect={(accountId) => {
                    change(
                      link,
                      { accountId },
                      say('screens.adminArea.seerrCard.savedWhoTheyAskAs'),
                    );
                  }}
                />
              </SettingRow>
            </SettingList>

            {link.isEnabled && link.accountId === '' ? (
              <p className="text-sm text-text-muted">
                {say('screens.adminArea.seerrCard.chooseAnAccountBeforeTheySend')}
              </p>
            ) : null}

            {link.isEnabled ? (
              <div className="flex flex-col gap-3">
                <CopyableAddress
                  title={say('common.aPIKey')}
                  detail={say('screens.adminArea.seerrCard.pasteItIntoBothDialogs')}
                  address={link.apiKey}
                />

                {servers.map(({ kind, title: serverTitle, server }) => (
                  <CopyableAddress
                    key={kind}
                    title={serverTitle}
                    detail={say('screens.adminArea.seerrCard.hostnamePortSslUrlBase', {
                      hostname: server.hostname,
                      port: server.port,
                      ssl: server.isSsl ? say('common.on') : say('common.off'),
                      urlBase: server.urlBase,
                    })}
                    address={server.address}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.seerrCard.requestingIsOffSoThere')}
          </p>
        )}
      </div>
    </PanelCard>
  );
};

SeerrCard.displayName = 'SeerrCard';

export { SeerrCard };
