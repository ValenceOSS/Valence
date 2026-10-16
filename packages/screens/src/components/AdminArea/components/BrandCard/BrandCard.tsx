import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { NO_BRAND, VALENCE_ACCENT } from '@ValenceContracts/schemas/Brand';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { saveBrand } from '@ValenceClient/admin/saveBrand';
import { saveBrandLogo } from '@ValenceClient/admin/saveBrandLogo';
import type { Brand } from '@ValenceContracts/schemas/Brand';
import { say } from '@ValenceI18n/say';

const LOGO_TYPES = 'image/png,image/jpeg,image/webp,image/avif';

/**
 * Where an administrator gives the server a name, a logo, an accent and a description of its own, in
 * place of Valence's — in the apps' title, mark, icon and colour, and in the emails it sends.
 */
const BrandCard = () => {
  const cache = useQueryClient();
  const appearance = useQuery(appearanceQueries.appearance());
  const brand = appearance.data?.brand ?? NO_BRAND;
  const [draft, setDraft] = useState<{
    name: string;
    accent: string | null;
    description: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const shown = draft ?? {
    name: brand.name ?? '',
    accent: brand.accent,
    description: brand.description ?? '',
  };

  const remember = (saved: Brand) => {
    cache.setQueryData(appearanceQueries.appearance().queryKey, (had) =>
      had === undefined ? had : { ...had, brand: saved },
    );
  };

  return (
    <PanelCard title={say('screens.adminArea.brandCard.yourOwnBrand')} isFlush>
      <SettingList isInset>
        <SettingRow
          title={say('common.name')}
          description={say('screens.adminArea.brandCard.nameDetail')}
        >
          <TextField
            label={say('common.name')}
            isLabelHidden
            size="sm"
            value={shown.name}
            placeholder={say('common.valence')}
            onValueChange={(name) => {
              setDraft({ ...shown, name });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.brandCard.accent')}
          description={say('screens.adminArea.brandCard.accentDetail')}
        >
          <div className="flex items-center gap-2">
            <ColourChoice
              label={say('screens.adminArea.brandCard.accent')}
              value={shown.accent ?? VALENCE_ACCENT}
              isCompact
              onChange={(accent) => {
                setDraft({ ...shown, accent });
              }}
            />
            {shown.accent === null ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft({ ...shown, accent: null });
                }}
              >
                {say('screens.adminArea.brandCard.useValencesOwn')}
              </Button>
            )}
          </div>
        </SettingRow>

        <SettingRow
          title={say('common.description')}
          description={say('screens.adminArea.brandCard.descriptionDetail')}
        >
          <TextField
            label={say('common.description')}
            isLabelHidden
            size="sm"
            value={shown.description}
            onValueChange={(description) => {
              setDraft({ ...shown, description });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.artworkPicker.logo')}
          description={say('screens.adminArea.brandCard.logoDetail')}
        >
          <div className="flex items-center gap-2">
            {brand.logo === null ? null : (
              <img
                src={brand.logo}
                alt=""
                width={32}
                height={32}
                className="rounded-md object-contain"
              />
            )}
            <FilePicker
              label={say('screens.adminArea.brandCard.uploadALogo')}
              accept={LOGO_TYPES}
              variant="secondary"
              size="sm"
              onPick={(file) => {
                void saveBrandLogo(file).then((saved) => {
                  tellOutcome(
                    say('screens.adminArea.brandCard.logoSaved'),
                    saved === null ? say('screens.adminArea.brandCard.logoCouldNotBeSaved') : null,
                  );

                  if (saved !== null) {
                    remember(saved);
                  }
                });
              }}
            >
              {say('screens.adminArea.brandCard.uploadALogo')}
            </FilePicker>
            {brand.logo === null ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void saveBrandLogo(null).then((saved) => {
                    if (saved !== null) {
                      remember(saved);
                    }
                  });
                }}
              >
                {say('screens.adminArea.brandCard.useValencesOwn')}
              </Button>
            )}
          </div>
        </SettingRow>

        <SettingRow title={say('screens.adminArea.brandCard.saveTheBrand')}>
          <Button
            variant="secondary"
            size="sm"
            disabled={draft === null || isSaving}
            onClick={() => {
              setIsSaving(true);

              void saveBrand({
                name: shown.name.trim() === '' ? null : shown.name.trim(),
                accent: shown.accent,
                description: shown.description.trim() === '' ? null : shown.description.trim(),
              }).then((saved) => {
                setIsSaving(false);
                tellOutcome(
                  say('screens.adminArea.brandCard.brandSaved'),
                  saved === null ? say('screens.adminArea.brandCard.brandCouldNotBeSaved') : null,
                );

                if (saved !== null) {
                  remember(saved);
                  setDraft(null);
                }
              });
            }}
          >
            {say('screens.adminArea.brandCard.saveBrand')}
          </Button>
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

BrandCard.displayName = 'BrandCard';

export { BrandCard };
