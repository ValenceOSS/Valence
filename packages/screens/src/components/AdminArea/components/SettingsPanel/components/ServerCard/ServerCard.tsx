import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { saveBrand } from '@ValenceClient/admin/saveBrand';
import { saveBrandLogo } from '@ValenceClient/admin/saveBrandLogo';
import {
  saveCertificationRegion,
  saveRoundness,
  saveServerLanguage,
} from '@ValenceClient/admin/fetchAdmin';
import { languageChoices } from '@ValenceClient/language/languageChoices';
import { SAME_AS_THE_DEVICE } from '@ValenceClient/language/SAME_AS_THE_DEVICE';
import { isLanguage } from '@ValenceI18n/isLanguage';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import {
  ROUNDNESS_LABELS,
  ROUNDNESS_LEVELS,
  RoundnessSchema,
} from '@ValenceContracts/schemas/Roundness';
import { NO_BRAND, VALENCE_ACCENT } from '@ValenceContracts/schemas/Brand';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { SettingMenu } from '@ValenceScreens/components/AdminArea/components/SettingMenu/SettingMenu';
import { certificationRegions } from '@ValenceScreens/components/AdminArea/certificationRegions';
import { say } from '@ValenceI18n/say';
import type { Brand, BrandSettings } from '@ValenceContracts/schemas/Brand';
import type { ServerCardProps } from './ServerCard.types';

const LOGO_TYPES = 'image/png,image/jpeg,image/webp,image/avif';

const TYPING_SETTLES_MS = 700;

const ROUNDNESS_CHOICES = ROUNDNESS_LEVELS.map((level) => ({
  id: level,
  label: ROUNDNESS_LABELS[level],
}));

/**
 * Turns what was typed into what is stored, where an empty name or description means Valence's own.
 *
 * @param text - What was typed.
 * @returns The text, or nothing where only spaces were typed.
 */
const storedOf = (text: string | null): string | null =>
  text === null || text.trim() === '' ? null : text.trim();

/**
 * The server itself: what it is called and how it describes itself, its logo and accent colour,
 * how round the corners of everything are, the language it speaks to everybody who has not chosen
 * their own, and whose age ratings it reads. Each saves as it is
 * changed, and typing saves once it stops.
 *
 * @param overview - What the server reports about itself.
 */
const ServerCard = ({ overview }: ServerCardProps) => {
  const cache = useQueryClient();
  const appearance = useQuery(appearanceQueries.appearance());
  const brand = appearance.data?.brand ?? NO_BRAND;
  const settings = overview?.settings;

  const remember = (saved: Brand) => {
    cache.setQueryData(appearanceQueries.appearance().queryKey, (had) =>
      had === undefined ? had : { ...had, brand: saved },
    );
  };

  const reread = () => {
    void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
    void cache.invalidateQueries({ queryKey: appearanceQueries.key });
  };

  const [shownBrand, changeBrand] = useSavedSetting<BrandSettings>(
    { name: brand.name, accent: brand.accent, description: brand.description },
    (next) =>
      saveBrand({
        name: storedOf(next.name),
        accent: next.accent,
        description: storedOf(next.description),
      }).then((saved) => {
        if (saved !== null) {
          remember(saved);
        }

        return saved !== null;
      }),
    {
      done: say('screens.adminArea.brandCard.brandSaved'),
      failed: say('screens.adminArea.brandCard.brandCouldNotBeSaved'),
      delayMs: TYPING_SETTLES_MS,
    },
  );

  const [roundness, changeRoundness] = useSavedSetting(
    settings?.roundness ?? 'default',
    saveRoundness,
    {
      done: say('screens.adminArea.settingsPanel.roundnessSaved'),
      failed: say('screens.adminArea.settingsPanel.roundnessCouldNotBeSaved'),
      onSaved: reread,
    },
  );

  const [language, changeLanguage] = useSavedSetting(
    settings?.language ?? null,
    saveServerLanguage,
    {
      done: say('screens.adminArea.serverCard.languageSaved'),
      failed: say('screens.adminArea.serverCard.languageCouldNotBeSaved'),
      onSaved: reread,
    },
  );

  const [region, changeRegion] = useSavedSetting(
    settings?.certificationRegion ?? 'GB',
    saveCertificationRegion,
    {
      done: say('screens.adminArea.settingsPanel.certificationRegionSaved'),
      failed: say('screens.adminArea.settingsPanel.theCertificationRegionCouldNotBe'),
      onSaved: reread,
    },
  );

  const changeLogo = (file: File | null) => {
    void saveBrandLogo(file).then((saved) => {
      tellOutcome(
        file === null
          ? say('screens.adminArea.serverCard.logoRemoved')
          : say('screens.adminArea.brandCard.logoSaved'),
        saved === null ? say('screens.adminArea.brandCard.logoCouldNotBeSaved') : null,
      );

      if (saved !== null) {
        remember(saved);
      }
    });
  };

  return (
    <PanelCard title={say('common.server')} isFlush>
      <SettingList isInset>
        <SettingRow
          title={say('common.name')}
          description={say('screens.adminArea.serverCard.nameDetail')}
        >
          <TextField
            label={say('common.name')}
            isLabelHidden
            size="sm"
            value={shownBrand.name ?? ''}
            placeholder={say('common.valence')}
            onValueChange={(name) => {
              changeBrand({ ...shownBrand, name });
            }}
            className="w-56 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title={say('common.description')}
          description={say('screens.adminArea.serverCard.descriptionDetail')}
        >
          <TextField
            label={say('common.description')}
            isLabelHidden
            size="sm"
            value={shownBrand.description ?? ''}
            placeholder={say('screens.adminArea.serverCard.aValenceServer')}
            onValueChange={(description) => {
              changeBrand({ ...shownBrand, description });
            }}
            className="w-56 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.artworkPicker.logo')}
          description={say('screens.adminArea.serverCard.logoDetail')}
        >
          {brand.logo === null ? null : (
            <img src={brand.logo} alt="" width={32} height={32} className="rounded-md" />
          )}
          {brand.logo === null ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                changeLogo(null);
              }}
            >
              {say('common.forget')}
            </Button>
          )}
          <FilePicker
            label={say('screens.adminArea.brandCard.uploadALogo')}
            accept={LOGO_TYPES}
            variant="secondary"
            size="sm"
            onPick={changeLogo}
          >
            <Icon of={ImageIcon} size={15} />
            {brand.logo === null ? say('common.upload') : say('common.replace')}
          </FilePicker>
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.brandCard.accent')}
          description={say('screens.adminArea.serverCard.accentDetail')}
        >
          {shownBrand.accent === null ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                changeBrand({ ...shownBrand, accent: null });
              }}
            >
              {say('screens.jobRunner.describeJobGroup.reset')}
            </Button>
          )}
          <ColourChoice
            label={say('screens.adminArea.brandCard.accent')}
            value={shownBrand.accent ?? VALENCE_ACCENT}
            isCompact
            onChange={(accent) => {
              changeBrand({ ...shownBrand, accent });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.serverCard.corners')}
          description={say('screens.adminArea.serverCard.cornersDetail')}
        >
          <SegmentedRow
            label={say('screens.adminArea.serverCard.corners')}
            size="sm"
            tone="accent"
            items={ROUNDNESS_CHOICES}
            value={roundness}
            onSelect={(id) => {
              const chosen = RoundnessSchema.safeParse(id);

              if (chosen.success) {
                changeRoundness(chosen.data);
              }
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('common.language')}
          description={say('screens.adminArea.serverCard.languageDetail')}
        >
          <SettingMenu
            label={say('common.language')}
            value={language ?? SAME_AS_THE_DEVICE}
            options={languageChoices(say('screens.adminArea.serverCard.eachDevicesOwn'))}
            onSelect={(id) => {
              changeLanguage(isLanguage(id) ? id : null);
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.describeLibraryPart.ageRatings')}
          info={
            <PanelCardInfo
              label={say('screens.adminArea.statStrip.aboutLabel', {
                label: say('screens.adminArea.describeLibraryPart.ageRatings'),
              })}
              detail={say('screens.adminArea.serverCard.ageRatingsAbout')}
              align="start"
            />
          }
          description={say('screens.adminArea.serverCard.ageRatingsDetail')}
        >
          <SettingMenu
            label={say('screens.adminArea.describeLibraryPart.ageRatings')}
            value={region}
            options={certificationRegions}
            onSelect={changeRegion}
          />
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

ServerCard.displayName = 'ServerCard';

export { ServerCard };
