import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Link } from '@ValenceUI/Link';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { saveSubtitleSetup } from '@ValenceClient/admin/saveSubtitleSetup';
import { SUBTITLE_LANGUAGES } from '@ValenceContracts/constants/SUBTITLE_LANGUAGES';
import { failureOfMissing } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { SubtitleSetup } from '@ValenceContracts/schemas/SubtitleFinding';
import { say } from '@ValenceI18n/say';

const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' });

const LANGUAGE_CHOICES = SUBTITLE_LANGUAGES.map((code) => ({
  id: code,
  label: LANGUAGE_NAMES.of(code) ?? code,
}));

type Draft = {
  openSubtitlesKey: string;
  openSubtitlesUsername: string;
  openSubtitlesPassword: string;
  subdlKey: string;
  languages: string[];
  isAutomatic: boolean;
  filmMinimumScore: number;
  episodeMinimumScore: number;
};

/**
 * What the form starts from: the account and languages saved, and every secret left empty, since
 * an empty one keeps what is saved.
 *
 * @param setup - The settings as saved.
 * @returns The form's first state.
 */
const draftOf = (setup: SubtitleSetup): Draft => ({
  openSubtitlesKey: '',
  openSubtitlesUsername: setup.openSubtitlesUsername,
  openSubtitlesPassword: '',
  subdlKey: '',
  languages: [...setup.languages],
  isAutomatic: setup.isAutomatic,
  filmMinimumScore: setup.filmMinimumScore,
  episodeMinimumScore: setup.episodeMinimumScore,
});

/**
 * Where Valence finds subtitles for what the libraries hold: the keys for OpenSubtitles and SubDL,
 * the OpenSubtitles account downloads are counted against, and the languages offered first when
 * somebody looks for subtitles. Keys and the password are never shown once saved; a field left
 * empty keeps what is saved.
 */
const SubtitlesCard = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.subtitleSetup());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const title = say('common.subtitles');
  const setup = asked.data;

  if (asked.isError) {
    return (
      <PanelCard title={title}>
        <CouldNotRead
          said={say('screens.adminArea.subtitlesCard.theSubtitleSettingsCouldNotBe')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </PanelCard>
    );
  }

  if (setup === undefined) {
    return (
      <PanelCard title={title}>
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.subtitlesCard.readingTheSubtitleSettings')}
        />
      </PanelCard>
    );
  }

  const shown = draft ?? draftOf(setup);
  const isChanged = JSON.stringify(shown) !== JSON.stringify(draftOf(setup));

  const change = (patch: Partial<Draft>) => {
    setDraft({ ...shown, ...patch });
  };

  return (
    <PanelCard title={title}>
      <div className="flex flex-col gap-5">
        <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {say('screens.adminArea.subtitlesCard.findSubtitlesForWhatYourLibraries')}
        </p>

        <Callout tone="quiet" title={say('screens.adminArea.subtitlesCard.whatLeavesTheServer')}>
          {say('screens.adminArea.subtitlesCard.whenYouLookTheTitleAndA')}
        </Callout>

        <SettingList>
          <SettingGroup
            title={say('screens.adminArea.subtitlesCard.openSubtitles')}
            description={say('screens.adminArea.subtitlesCard.theBiggestCatalogueAKeyIs')}
          >
            <div className="flex flex-col gap-3">
              <TextField
                label={say('screens.adminArea.subtitlesCard.apiKey')}
                type="password"
                autoComplete="off"
                placeholder={
                  setup.hasOpenSubtitlesKey
                    ? say('screens.adminArea.emailCard.savedLeaveEmptyToKeep')
                    : ''
                }
                value={shown.openSubtitlesKey}
                onValueChange={(openSubtitlesKey) => {
                  change({ openSubtitlesKey });
                }}
              />

              <div className="grid items-start gap-3 sm:grid-cols-2">
                <TextField
                  label={say('common.username')}
                  autoComplete="off"
                  value={shown.openSubtitlesUsername}
                  onValueChange={(openSubtitlesUsername) => {
                    change({ openSubtitlesUsername });
                  }}
                />

                <TextField
                  label={say('common.password')}
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    setup.hasOpenSubtitlesPassword
                      ? say('screens.adminArea.emailCard.savedLeaveEmptyToKeep')
                      : ''
                  }
                  value={shown.openSubtitlesPassword}
                  onValueChange={(openSubtitlesPassword) => {
                    change({ openSubtitlesPassword });
                  }}
                />
              </div>

              <Link href="https://www.opensubtitles.com/en/consumers">
                {say('screens.adminArea.subtitlesCard.getAnOpenSubtitlesKey')}
              </Link>
            </div>
          </SettingGroup>

          <SettingGroup
            title={say('screens.adminArea.subtitlesCard.subdl')}
            description={say('screens.adminArea.subtitlesCard.askedToo')}
          >
            <div className="flex flex-col gap-3">
              <TextField
                label={say('screens.adminArea.subtitlesCard.apiKey')}
                type="password"
                autoComplete="off"
                placeholder={
                  setup.hasSubdlKey ? say('screens.adminArea.emailCard.savedLeaveEmptyToKeep') : ''
                }
                value={shown.subdlKey}
                onValueChange={(subdlKey) => {
                  change({ subdlKey });
                }}
              />

              <Link href="https://subdl.com/panel/api">
                {say('screens.adminArea.subtitlesCard.getASubdlKey')}
              </Link>
            </div>
          </SettingGroup>

          <SettingGroup
            title={say('screens.adminArea.subtitlesCard.languages')}
            description={say('screens.adminArea.subtitlesCard.offeredFirstWhenSomebodyLooks')}
          >
            <MultiSelectField
              label={say('screens.adminArea.subtitlesCard.languages')}
              isLabelHidden
              placeholder={say('common.none')}
              options={LANGUAGE_CHOICES}
              value={shown.languages}
              onChange={(languages) => {
                change({ languages });
              }}
              className="max-w-md"
            />
          </SettingGroup>

          <SettingRow
            title={say('screens.adminArea.subtitlesCard.fetchAutomatically')}
            description={say('screens.adminArea.subtitlesCard.whenNewFilmsAndEpisodesArrive')}
          >
            <Switch
              label={say('screens.adminArea.subtitlesCard.fetchAutomatically')}
              isLabelHidden
              isOn={shown.isAutomatic}
              onToggle={() => {
                change({ isAutomatic: !shown.isAutomatic });
              }}
            />
          </SettingRow>

          {shown.isAutomatic ? (
            <SettingGroup
              title={say('screens.adminArea.subtitlesCard.minimumScore')}
              description={say('screens.adminArea.subtitlesCard.onlyTakesASubtitleThatScores')}
            >
              <div className="grid max-w-md items-start gap-3 sm:grid-cols-2">
                <TextField
                  label={say('common.films')}
                  type="number"
                  min={0}
                  max={100}
                  value={shown.filmMinimumScore.toString()}
                  onValueChange={(value) => {
                    change({ filmMinimumScore: Math.min(100, Math.max(0, Number(value) || 0)) });
                  }}
                />
                <TextField
                  label={say('common.episodes')}
                  type="number"
                  min={0}
                  max={100}
                  value={shown.episodeMinimumScore.toString()}
                  onValueChange={(value) => {
                    change({
                      episodeMinimumScore: Math.min(100, Math.max(0, Number(value) || 0)),
                    });
                  }}
                />
              </div>
            </SettingGroup>
          ) : null}
        </SettingList>

        <div className="flex justify-end">
          <Button
            variant="confirm"
            size="sm"
            disabled={!isChanged}
            isLoading={isSaving}
            onClick={() => {
              setIsSaving(true);

              void saveSubtitleSetup(shown).then((answer) => {
                setIsSaving(false);

                if (
                  tellOutcome(
                    say('screens.adminArea.subtitlesCard.savedTheSubtitleSettings'),
                    failureOfMissing(answer),
                  ) &&
                  answer !== null
                ) {
                  cache.setQueryData(adminQueries.subtitleSetup().queryKey, answer);
                  void cache.invalidateQueries({ queryKey: ['subtitles'] });
                  setDraft(null);
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </div>
      </div>
    </PanelCard>
  );
};

SubtitlesCard.displayName = 'SubtitlesCard';

export { SubtitlesCard };
