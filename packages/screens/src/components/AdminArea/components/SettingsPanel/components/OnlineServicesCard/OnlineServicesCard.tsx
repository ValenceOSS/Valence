import { saveFanartKey } from '@ValenceClient/admin/saveFanartKey';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import {
  saveAudioDbKey,
  saveCatalogueKey,
  saveFetchesCatalogueTrailers,
  saveFetchesMusicDetails,
  saveOmdbKey,
  saveTelemetryEnabled,
  saveUsesPushRelay,
} from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { ServiceKeyRow } from '@ValenceScreens/components/AdminArea/components/SettingsPanel/components/ServiceKeyRow/ServiceKeyRow';
import { TelemetryPreviewDialog } from './components/TelemetryPreviewDialog/TelemetryPreviewDialog';
import { say } from '@ValenceI18n/say';
import type { ReactNode } from 'react';
import type { OnlineServicesCardProps } from './OnlineServicesCard.types';

const OMDB_FREE_KEY = 'https://www.omdbapi.com/apikey.aspx';

const FANART_FREE_KEY = 'https://fanart.tv/get-an-api-key/';

/**
 * Everything Valence reaches outside this server, in two groups: the services that need a key, each
 * saying whether one is set, and the features that go online, each a switch that saves as it is
 * turned. Usage statistics shows exactly what it sends, and says so where the environment forbids
 * sending at all.
 *
 * @param overview - What the server reports about itself.
 */
const OnlineServicesCard = ({ overview }: OnlineServicesCardProps) => {
  const cache = useQueryClient();
  const settings = overview?.settings;
  const [isShowingReport, setIsShowingReport] = useState(false);
  const isTelemetryForbidden = settings?.isTelemetryOffByEnvironment ?? false;

  const reread = () => {
    void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
  };

  const [fetchesTrailers, changeFetchesTrailers] = useSavedSetting(
    settings?.fetchesCatalogueTrailers ?? false,
    saveFetchesCatalogueTrailers,
    {
      done: say('screens.adminArea.settingsPanel.trailerSettingSaved'),
      failed: say('screens.adminArea.settingsPanel.theTrailerSettingCouldNotBe'),
      onSaved: reread,
    },
  );

  const [fetchesMusic, changeFetchesMusic] = useSavedSetting(
    settings?.fetchesMusicDetails ?? false,
    saveFetchesMusicDetails,
    {
      done: say('screens.adminArea.settingsPanel.musicDetailsSettingSaved'),
      failed: say('screens.adminArea.settingsPanel.theMusicDetailsSettingCouldNot'),
      onSaved: reread,
    },
  );

  const [usesPushRelay, changeUsesPushRelay] = useSavedSetting(
    settings?.usesPushRelay ?? false,
    saveUsesPushRelay,
    {
      done: say('screens.adminArea.phoneNotificationsRow.phoneNotificationsSettingSaved'),
      failed: say('screens.adminArea.phoneNotificationsRow.thePhoneNotificationsSettingCouldNotBe'),
      onSaved: reread,
    },
  );

  const [sharesStatistics, changeSharesStatistics] = useSavedSetting(
    settings?.telemetryEnabled ?? true,
    saveTelemetryEnabled,
    {
      done: say('screens.adminArea.usageStatisticsRow.usageStatisticsSettingSaved'),
      failed: say('screens.adminArea.usageStatisticsRow.theUsageStatisticsSettingCouldNotBe'),
      onSaved: reread,
    },
  );

  const about = (title: string, detail: string) => (
    <PanelCardInfo
      label={say('screens.adminArea.statStrip.aboutLabel', { label: title })}
      detail={detail}
      align="start"
    />
  );

  const feature = (
    title: string,
    detail: string,
    description: ReactNode,
    isOn: boolean,
    onToggle: () => void,
    isDisabled = false,
  ) => (
    <SettingRow title={title} info={about(title, detail)} description={description}>
      <Switch label={title} isLabelHidden isOn={isOn} disabled={isDisabled} onToggle={onToggle} />
    </SettingRow>
  );

  return (
    <PanelCard title={say('screens.adminArea.onlineServicesCard.onlineServices')} isFlush>
      <p className="px-5 pt-4 pb-1 font-body text-[0.8125rem] text-text-muted">
        {say('screens.adminArea.onlineServicesCard.everythingValenceConnectsTo')}
      </p>

      <h3 className="px-5 pt-4 text-xs font-medium text-text-muted">
        {say('screens.accountArea.aPIKeys')}
      </h3>
      <SettingList isInset>
        <ServiceKeyRow
          title={say('screens.adminArea.onlineServicesCard.theMovieDatabase')}
          about={say('screens.adminArea.onlineServicesCard.theMovieDatabaseAbout')}
          description={say('screens.adminArea.onlineServicesCard.theMovieDatabaseDetail')}
          isSet={settings?.hasCatalogueKey ?? false}
          save={saveCatalogueKey}
          done={say('screens.adminArea.settingsPanel.catalogueKeySaved')}
          failed={say('screens.adminArea.settingsPanel.theCatalogueKeyCouldNotBe')}
          onSaved={reread}
        />

        <ServiceKeyRow
          title={say('screens.adminArea.onlineServicesCard.omdb')}
          about={say('screens.adminArea.onlineServicesCard.omdbAbout')}
          description={say('screens.adminArea.onlineServicesCard.omdbDetail')}
          isSet={settings?.hasOmdbKey ?? false}
          freeKeyAt={OMDB_FREE_KEY}
          save={saveOmdbKey}
          done={say('screens.adminArea.settingsPanel.oMDbKeySaved')}
          failed={say('screens.adminArea.settingsPanel.theOMDbKeyCouldNotBe')}
          onSaved={reread}
        />

        <ServiceKeyRow
          title={say('screens.adminArea.onlineServicesCard.fanartTv')}
          about={say('screens.adminArea.onlineServicesCard.fanartTvAbout')}
          description={say('screens.adminArea.onlineServicesCard.fanartTvDetail')}
          isSet={settings?.hasFanartKey ?? false}
          freeKeyAt={FANART_FREE_KEY}
          save={saveFanartKey}
          done={say('screens.adminArea.settingsPanel.fanartTvKeySaved')}
          failed={say('screens.adminArea.settingsPanel.theFanartTvKeyCouldNotBe')}
          onSaved={reread}
        />

        <ServiceKeyRow
          title={say('screens.adminArea.onlineServicesCard.theAudioDb')}
          about={say('screens.adminArea.onlineServicesCard.theAudioDbAbout')}
          description={say('screens.adminArea.onlineServicesCard.theAudioDbDetail')}
          isSet={settings?.hasAudioDbKey ?? false}
          save={saveAudioDbKey}
          done={say('screens.adminArea.settingsPanel.theAudioDBKeySaved')}
          failed={say('screens.adminArea.settingsPanel.theTheAudioDBKeyCouldNotBe')}
          onSaved={reread}
        />
      </SettingList>

      <h3 className="border-t border-[var(--surface-line)] px-5 pt-4 text-xs font-medium text-text-muted">
        {say('ui.siteNav.features')}
      </h3>
      <SettingList isInset>
        {feature(
          say('screens.adminArea.describeLibraryPart.trailers'),
          say('screens.adminArea.onlineServicesCard.trailersAbout'),
          say('screens.adminArea.onlineServicesCard.trailersDetail'),
          fetchesTrailers,
          () => {
            changeFetchesTrailers(!fetchesTrailers);
          },
        )}

        {feature(
          say('screens.adminArea.onlineServicesCard.musicDetails'),
          say('screens.adminArea.onlineServicesCard.musicDetailsAbout'),
          say('screens.adminArea.onlineServicesCard.musicDetailsDetail'),
          fetchesMusic,
          () => {
            changeFetchesMusic(!fetchesMusic);
          },
        )}

        {feature(
          say('screens.adminArea.phoneNotificationsRow.phoneNotifications'),
          say('screens.adminArea.onlineServicesCard.phoneNotificationsAbout'),
          say('screens.adminArea.onlineServicesCard.phoneNotificationsDetail'),
          usesPushRelay,
          () => {
            changeUsesPushRelay(!usesPushRelay);
          },
        )}

        {feature(
          say('screens.adminArea.onlineServicesCard.usageStatistics'),
          say('screens.adminArea.onlineServicesCard.usageStatisticsAbout'),
          isTelemetryForbidden ? (
            say('common.anonymousStatisticsAreTurnedOffByTheEnvironment')
          ) : (
            <>
              {say('screens.adminArea.onlineServicesCard.usageStatisticsDetail')}{' '}
              <Button
                variant="link"
                size="none"
                className="inline text-[0.8125rem] text-text underline"
                onClick={() => {
                  setIsShowingReport(true);
                }}
              >
                {say('screens.adminArea.onlineServicesCard.seeWhatsSent')}
              </Button>
            </>
          ),
          sharesStatistics && !isTelemetryForbidden,
          () => {
            changeSharesStatistics(!sharesStatistics);
          },
          isTelemetryForbidden,
        )}
      </SettingList>

      <TelemetryPreviewDialog
        isOpen={isShowingReport}
        onClose={() => {
          setIsShowingReport(false);
        }}
      />
    </PanelCard>
  );
};

OnlineServicesCard.displayName = 'OnlineServicesCard';

export { OnlineServicesCard };
