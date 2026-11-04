import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { SelectField } from '@ValenceUI/SelectField';
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
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { PanelCard } from '@ValenceUI/PanelCard';
import type { SubtitleSetup } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleSettings } from '@ValenceContracts/schemas/SubtitleSettings';
import { SourceRow } from './components/SourceRow/SourceRow';
import { say } from '@ValenceI18n/say';

const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' });

const LANGUAGE_CHOICES = SUBTITLE_LANGUAGES.map((code) => ({
  id: code,
  label: LANGUAGE_NAMES.of(code) ?? code,
}));

const AUTO = 'auto';

const MODEL_CHOICES: { id: SubtitleSettings['whisperModel']; label: string }[] = [
  { id: 'tiny', label: say('screens.adminArea.subtitlesCard.modelTiny') },
  { id: 'base', label: say('screens.adminArea.subtitlesCard.modelBase') },
  { id: 'small', label: say('common.small') },
  { id: 'medium', label: say('common.medium') },
  { id: 'large-v3-turbo', label: say('screens.adminArea.subtitlesCard.modelLarge') },
];

const HEARD_CHOICES = [
  { id: AUTO, label: say('screens.adminArea.subtitlesCard.whateverIsSpoken') },
  ...LANGUAGE_CHOICES,
];

type Draft = {
  openSubtitlesKey: string;
  openSubtitlesUsername: string;
  openSubtitlesPassword: string;
  subdlKey: string;
  languages: string[];
  isAutomatic: boolean;
  filmMinimumScore: number;
  episodeMinimumScore: number;
  writesSubtitles: boolean;
  whisperModel: SubtitleSettings['whisperModel'];
  whisperLanguage: string | null;
  translatesToEnglish: boolean;
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
  writesSubtitles: setup.writesSubtitles,
  whisperModel: setup.whisperModel,
  whisperLanguage: setup.whisperLanguage,
  translatesToEnglish: setup.translatesToEnglish,
});

const MATCH_CHOICES = [
  { id: '100', label: say('screens.adminArea.subtitlesCard.exactFileOnly') },
  { id: '80', label: say('screens.findSubtitlesDialog.sameRelease') },
  { id: '60', label: say('screens.adminArea.subtitlesCard.closeMatch') },
  { id: '0', label: say('common.anything') },
];

/**
 * The info button beside a setting's name.
 *
 * @param label - The setting.
 * @param detail - What to say about it.
 * @returns The button.
 */
const about = (label: string, detail: string) => (
  <PanelCardInfo
    label={say('screens.adminArea.statStrip.aboutLabel', { label })}
    detail={detail}
    align="start"
  />
);

/**
 * The match levels to offer, keeping one saved before the levels were fixed.
 *
 * @param value - The minimum score saved.
 * @returns The choices.
 */
const matchChoicesFor = (value: number) =>
  MATCH_CHOICES.some((one) => one.id === value.toString())
    ? MATCH_CHOICES
    : [
        ...MATCH_CHOICES,
        {
          id: value.toString(),
          label: say('screens.adminArea.subtitlesCard.scoreOrMore', { score: value.toString() }),
        },
      ];

/**
 * Where Valence finds subtitles for what the libraries hold, and what it does with them: the
 * languages offered first, fetching on its own, writing them with Whisper, and the keys for
 * OpenSubtitles and SubDL. Each setting saves as it is changed; a key or password is never shown
 * once saved.
 */
const SubtitlesCard = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.subtitleSetup());
  const [pending, setPending] = useState<Partial<Draft>>({});
  const [secrets, setSecrets] = useState<{
    openSubtitlesKey: string;
    openSubtitlesUsername: string | null;
    openSubtitlesPassword: string;
    subdlKey: string;
  }>({
    openSubtitlesKey: '',
    openSubtitlesUsername: null,
    openSubtitlesPassword: '',
    subdlKey: '',
  });
  const [savingSource, setSavingSource] = useState<'openSubtitles' | 'subdl' | null>(null);
  const title = say('common.subtitles');
  const setup = asked.data;

  if (asked.isError || setup === undefined) {
    return (
      <PanelCard title={title}>
        {asked.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.subtitlesCard.theSubtitleSettingsCouldNotBe')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : (
          <Spinner
            isCentered
            size="sm"
            label={say('screens.adminArea.subtitlesCard.readingTheSubtitleSettings')}
          />
        )}
      </PanelCard>
    );
  }

  const shown = { ...draftOf(setup), ...pending };

  const save = (patch: Partial<Draft>): Promise<boolean> => {
    setPending((was) => ({ ...was, ...patch }));

    return saveSubtitleSetup({ ...shown, ...patch }).then((answer) => {
      setPending({});

      if (
        tellOutcome(
          say('screens.adminArea.subtitlesCard.savedTheSubtitleSettings'),
          failureOfMissing(answer),
        ) &&
        answer !== null
      ) {
        cache.setQueryData(adminQueries.subtitleSetup().queryKey, answer);
        void cache.invalidateQueries({ queryKey: ['subtitles'] });

        return true;
      }

      return false;
    });
  };

  const username = secrets.openSubtitlesUsername ?? setup.openSubtitlesUsername;

  return (
    <div className="flex flex-col gap-4">
      <PanelCard
        title={title}
        isFlush
        actions={about(
          title,
          say('screens.adminArea.subtitlesCard.findSubtitlesForWhatYourLibraries'),
        )}
      >
        <SettingList isInset>
          <SettingRow
            title={say('screens.adminArea.subtitlesCard.languages')}
            description={say('screens.adminArea.subtitlesCard.languagesDetail')}
          >
            <MultiSelectField
              label={say('screens.adminArea.subtitlesCard.languages')}
              isLabelHidden
              size="sm"
              placeholder={say('common.none')}
              options={LANGUAGE_CHOICES}
              value={shown.languages}
              onChange={(languages) => {
                void save({ languages });
              }}
              className="w-56 max-w-full"
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.subtitlesCard.fetchAutomatically')}
            description={say('screens.adminArea.subtitlesCard.fetchAutomaticallyDetail')}
          >
            <Switch
              label={say('screens.adminArea.subtitlesCard.fetchAutomatically')}
              isLabelHidden
              isOn={shown.isAutomatic}
              onToggle={() => {
                void save({ isAutomatic: !shown.isAutomatic });
              }}
            />
          </SettingRow>

          {shown.isAutomatic
            ? (['film', 'episode'] as const).map((which) => {
                const value = which === 'film' ? shown.filmMinimumScore : shown.episodeMinimumScore;
                const label =
                  which === 'film'
                    ? say('screens.adminArea.subtitlesCard.filmMatch')
                    : say('screens.adminArea.subtitlesCard.episodeMatch');

                return (
                  <SettingRow
                    key={which}
                    title={label}
                    info={about(
                      'match',
                      say('screens.adminArea.subtitlesCard.onlyTakesASubtitleThatScores'),
                    )}
                    description={
                      which === 'film'
                        ? say('screens.adminArea.subtitlesCard.filmMatchDetail')
                        : say('screens.adminArea.subtitlesCard.episodeMatchDetail')
                    }
                  >
                    <SelectField
                      label={label}
                      isLabelHidden
                      size="sm"
                      className="w-56 max-w-full"
                      options={matchChoicesFor(value)}
                      value={value.toString()}
                      onSelect={(id) => {
                        void save(
                          which === 'film'
                            ? { filmMinimumScore: Number(id) }
                            : { episodeMinimumScore: Number(id) },
                        );
                      }}
                    />
                  </SettingRow>
                );
              })
            : null}

          <SettingRow
            title={say('screens.adminArea.subtitlesCard.writeSubtitlesWithWhisper')}
            info={about(
              say('screens.adminArea.subtitlesCard.whisper'),
              setup.canWriteSubtitles
                ? say('screens.adminArea.subtitlesCard.forFilmsAndEpisodesWithNoSubtitles')
                : say('screens.adminArea.subtitlesCard.whisperIsNotInstalledWithThe'),
            )}
            description={
              setup.canWriteSubtitles
                ? say('screens.adminArea.subtitlesCard.whisperDetail')
                : say('screens.adminArea.subtitlesCard.whisperNotInstalled')
            }
          >
            <Switch
              label={say('screens.adminArea.subtitlesCard.writeSubtitlesWithWhisper')}
              isLabelHidden
              isOn={shown.writesSubtitles}
              disabled={!setup.canWriteSubtitles && !shown.writesSubtitles}
              onToggle={() => {
                void save({ writesSubtitles: !shown.writesSubtitles });
              }}
            />
          </SettingRow>

          {shown.writesSubtitles ? (
            <>
              <SettingRow
                title={say('screens.adminArea.hardware.model')}
                description={say('screens.adminArea.subtitlesCard.modelDetail')}
              >
                <SelectField
                  label={say('screens.adminArea.hardware.model')}
                  isLabelHidden
                  size="sm"
                  className="w-56 max-w-full"
                  options={MODEL_CHOICES}
                  value={shown.whisperModel}
                  onSelect={(id) => {
                    const picked = MODEL_CHOICES.find((choice) => choice.id === id);

                    if (picked !== undefined) {
                      void save({ whisperModel: picked.id });
                    }
                  }}
                />
              </SettingRow>

              <SettingRow
                title={say('screens.adminArea.subtitlesCard.languageSpoken')}
                description={say('screens.adminArea.subtitlesCard.languageSpokenDetail')}
              >
                <SelectField
                  label={say('screens.adminArea.subtitlesCard.languageSpoken')}
                  isLabelHidden
                  size="sm"
                  className="w-56 max-w-full"
                  options={HEARD_CHOICES}
                  value={shown.whisperLanguage ?? AUTO}
                  onSelect={(id) => {
                    void save({ whisperLanguage: id === AUTO ? null : id });
                  }}
                />
              </SettingRow>

              <SettingRow
                title={say('screens.adminArea.subtitlesCard.writeThemInEnglish')}
                description={say('screens.adminArea.subtitlesCard.translatesWhatIsSaidIntoEnglish')}
              >
                <Switch
                  label={say('screens.adminArea.subtitlesCard.writeThemInEnglish')}
                  isLabelHidden
                  isOn={shown.translatesToEnglish}
                  onToggle={() => {
                    void save({ translatesToEnglish: !shown.translatesToEnglish });
                  }}
                />
              </SettingRow>
            </>
          ) : null}
        </SettingList>
      </PanelCard>

      <PanelCard title={say('common.sources')} isFlush>
        <SettingList isInset>
          <SourceRow
            title={say('screens.adminArea.subtitlesCard.openSubtitles')}
            description={
              setup.openSubtitlesUsername === ''
                ? say('screens.adminArea.subtitlesCard.openSubtitlesDetail')
                : say('screens.adminArea.subtitlesCard.openSubtitlesDetailWithAccount', {
                    username: setup.openSubtitlesUsername,
                  })
            }
            isSet={setup.hasOpenSubtitlesKey}
            freeKeyAt="https://www.opensubtitles.com/en/consumers"
            canSave={
              secrets.openSubtitlesKey !== '' ||
              secrets.openSubtitlesPassword !== '' ||
              username !== setup.openSubtitlesUsername
            }
            isSaving={savingSource === 'openSubtitles'}
            onCancel={() => {
              setSecrets((was) => ({
                ...was,
                openSubtitlesKey: '',
                openSubtitlesUsername: null,
                openSubtitlesPassword: '',
              }));
            }}
            onSave={() => {
              setSavingSource('openSubtitles');

              return save({
                openSubtitlesKey: secrets.openSubtitlesKey,
                openSubtitlesUsername: username,
                openSubtitlesPassword: secrets.openSubtitlesPassword,
              }).then((isSaved) => {
                setSavingSource(null);

                if (isSaved) {
                  setSecrets((was) => ({
                    ...was,
                    openSubtitlesKey: '',
                    openSubtitlesUsername: null,
                    openSubtitlesPassword: '',
                  }));
                }

                return isSaved;
              });
            }}
            fields={
              <>
                <TextField
                  label={say('common.aPIKey')}
                  type="password"
                  autoComplete="off"
                  size="sm"
                  placeholder={
                    setup.hasOpenSubtitlesKey
                      ? say('screens.adminArea.emailCard.savedLeaveEmptyToKeep')
                      : ''
                  }
                  value={secrets.openSubtitlesKey}
                  onValueChange={(openSubtitlesKey) => {
                    setSecrets((was) => ({ ...was, openSubtitlesKey }));
                  }}
                />
                <div className="grid items-start gap-3 sm:grid-cols-2">
                  <TextField
                    label={say('common.username')}
                    autoComplete="off"
                    size="sm"
                    value={username}
                    onValueChange={(openSubtitlesUsername) => {
                      setSecrets((was) => ({ ...was, openSubtitlesUsername }));
                    }}
                  />
                  <TextField
                    label={say('common.password')}
                    type="password"
                    autoComplete="new-password"
                    size="sm"
                    placeholder={
                      setup.hasOpenSubtitlesPassword
                        ? say('screens.adminArea.emailCard.savedLeaveEmptyToKeep')
                        : ''
                    }
                    value={secrets.openSubtitlesPassword}
                    onValueChange={(openSubtitlesPassword) => {
                      setSecrets((was) => ({ ...was, openSubtitlesPassword }));
                    }}
                  />
                </div>
              </>
            }
          />

          <SourceRow
            title={say('screens.adminArea.subtitlesCard.subdl')}
            description={say('screens.adminArea.subtitlesCard.askedToo')}
            isSet={setup.hasSubdlKey}
            freeKeyAt="https://subdl.com/panel/api"
            canSave={secrets.subdlKey !== ''}
            isSaving={savingSource === 'subdl'}
            onCancel={() => {
              setSecrets((was) => ({ ...was, subdlKey: '' }));
            }}
            onSave={() => {
              setSavingSource('subdl');

              return save({ subdlKey: secrets.subdlKey }).then((isSaved) => {
                setSavingSource(null);

                if (isSaved) {
                  setSecrets((was) => ({ ...was, subdlKey: '' }));
                }

                return isSaved;
              });
            }}
            fields={
              <TextField
                label={say('common.aPIKey')}
                type="password"
                autoComplete="off"
                size="sm"
                value={secrets.subdlKey}
                onValueChange={(subdlKey) => {
                  setSecrets((was) => ({ ...was, subdlKey }));
                }}
              />
            }
          />
        </SettingList>
      </PanelCard>
    </div>
  );
};

SubtitlesCard.displayName = 'SubtitlesCard';

export { SubtitlesCard };
