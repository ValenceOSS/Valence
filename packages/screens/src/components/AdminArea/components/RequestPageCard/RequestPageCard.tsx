import { useQueryClient } from '@tanstack/react-query';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { savePlaysCatalogueTrailers } from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { say } from '@ValenceI18n/say';
import type { RequestPageCardProps } from './RequestPageCard.types';

/**
 * How a title's request page looks: whether a muted trailer plays behind it. That needs trailers
 * turned on in the online services, and says so while they are off.
 *
 * @param overview - What the server reports about itself.
 */
const RequestPageCard = ({ overview }: RequestPageCardProps) => {
  const cache = useQueryClient();
  const canPlay = overview?.settings.fetchesCatalogueTrailers ?? false;
  const title = say('screens.adminArea.requestPageCard.backgroundTrailers');

  const [plays, changePlays] = useSavedSetting(
    overview?.settings.playsCatalogueTrailers ?? false,
    savePlaysCatalogueTrailers,
    {
      done: say('screens.adminArea.settingsPanel.trailerPlayingSettingSaved'),
      failed: say('screens.adminArea.settingsPanel.theTrailerPlayingSettingCouldNotBe'),
      onSaved: () => {
        void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
      },
    },
  );

  return (
    <PanelCard title={say('screens.adminArea.requestPageCard.requestPage')} isFlush>
      <SettingList isInset>
        <SettingRow
          title={title}
          info={
            <PanelCardInfo
              label={say('screens.adminArea.statStrip.aboutLabel', { label: title })}
              detail={say('screens.adminArea.requestPageCard.backgroundTrailersAbout')}
              align="start"
            />
          }
          description={
            canPlay
              ? say('screens.adminArea.requestPageCard.backgroundTrailersDetail')
              : say('screens.adminArea.requestPageCard.needsTrailersTurnedOn')
          }
        >
          <Switch
            label={title}
            isLabelHidden
            isOn={plays && canPlay}
            disabled={!canPlay}
            onToggle={() => {
              changePlays(!plays);
            }}
          />
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

RequestPageCard.displayName = 'RequestPageCard';

export { RequestPageCard };
