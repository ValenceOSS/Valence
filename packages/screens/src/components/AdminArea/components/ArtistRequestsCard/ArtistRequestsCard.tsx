import { useQueryClient } from '@tanstack/react-query';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { saveRequestReleaseTypes } from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { DEFAULT_RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import { say } from '@ValenceI18n/say';
import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import type { ArtistRequestsCardProps } from './ArtistRequestsCard.types';

/**
 * Which of an artist's releases a request for them downloads, unless the person asking chooses
 * otherwise. Saves as it is changed.
 *
 * @param overview - What the server reports about itself.
 */
const ArtistRequestsCard = ({ overview }: ArtistRequestsCardProps) => {
  const cache = useQueryClient();

  const [types, changeTypes] = useSavedSetting<readonly ReleaseType[]>(
    overview?.settings.requestReleaseTypes ?? DEFAULT_RELEASE_TYPES,
    saveRequestReleaseTypes,
    {
      done: say('screens.adminArea.settingsPanel.releaseTypesSaved'),
      failed: say('screens.adminArea.settingsPanel.theReleaseTypesCouldNotBe'),
      onSaved: () => {
        void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
      },
    },
  );

  return (
    <PanelCard title={say('screens.adminArea.artistRequestsCard.artistRequests')} isFlush>
      <SettingList isInset>
        <SettingRow
          title={say('screens.adminArea.artistRequestsCard.artistReleases')}
          description={say('screens.adminArea.artistRequestsCard.artistReleasesDetail')}
        >
          <div className="w-72 max-w-full">
            <ReleaseTypeChooser
              value={[...types]}
              onChange={(next) => {
                changeTypes(next);
              }}
            />
          </div>
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

ArtistRequestsCard.displayName = 'ArtistRequestsCard';

export { ArtistRequestsCard };
