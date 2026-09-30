import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Icon } from '@ValenceUI/Icon';
import {
  ChevronsUpDown as ChevronsUpDownIcon,
  Image as ImageIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react';
import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Badge } from '@ValenceUI/Badge';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { Switch } from '@ValenceUI/Switch';
import { FilePicker } from '@ValenceUI/FilePicker';
import {
  saveCertificationRegion,
  saveKeepsDownloadsForDays,
  saveCatalogueKey,
  saveHardwareAccel,
  savePreviewQuality,
  saveRoundness,
  saveShowsProfilesBeforeSignIn,
  saveFetchesCatalogueTrailers,
  saveFetchesMusicDetails,
  saveRequestReleaseTypes,
  saveAudioDbKey,
  saveOmdbKey,
  saveSplashscreen,
  removeSplashscreen,
} from '@ValenceClient/admin/fetchAdmin';
import {
  ROUNDNESS_LABELS,
  ROUNDNESS_LEVELS,
  RoundnessSchema,
} from '@ValenceContracts/schemas/Roundness';
import { PreviewQualitySchema } from '@ValenceContracts/schemas/PreviewQuality';
import { accelerationOptions } from '@ValenceScreens/components/AdminArea/accelerationOptions';
import type { SettingsPanelProps } from './SettingsPanel.types';

const PREVIEW_QUALITY_CHOICES = [
  { id: 'low', label: say('screens.adminArea.settingsPanel.low') },
  { id: 'standard', label: say('screens.adminArea.settingsPanel.standard') },
  { id: 'high', label: say('common.high') },
] as const;

const SPLASHSCREEN_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { certificationRegions } from '@ValenceScreens/components/AdminArea/certificationRegions';
import { downloadKeepingChoices } from '@ValenceScreens/components/AdminArea/downloadKeepingChoices';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const ROUNDNESS_CHOICES = ROUNDNESS_LEVELS.map((level) => ({
  id: level,
  label: ROUNDNESS_LABELS[level],
}));

/**
 * What this server is configured with and who may sign into it: the metadata catalogue key, which
 * encoder transcodes use, how good the hover previews are, and the accounts on the server. Each setting says what it means in
 * practice rather than only what it is set to, since most of them are invisible until something is
 * slow or a title comes out wrong.
 *
 * @param overview - What the server reports about itself, or null before it has answered.
 * @param onCatalogueKeySaved - Called once a catalogue key has been written.
 * @param onHardwareAccelSaved - Called once the encoder choice has been written.
 * @param onPreviewQualitySaved - Called once the preview preset has been written.
 * @param onProfileVisibilitySaved - Called once the choice about showing the faces has been written.
 * @param onSplashscreenSaved - Called once the picture behind the way in has been chosen or removed.
 * @param onMusicDetailsSaved - Called once looking for music details on the web is turned on or off.
 * @param onReleaseTypesSaved - Called once the kinds of record a request watches have been written.
 * @param onRoundnessSaved - Called once how round the application is has been written.
 */
const SettingsPanel = ({
  overview,
  onCatalogueKeySaved,
  onHardwareAccelSaved,
  onPreviewQualitySaved,
  onCertificationRegionSaved,
  onProfileVisibilitySaved,
  onCatalogueTrailersSaved,
  onMusicDetailsSaved,
  onReleaseTypesSaved,
  onRoundnessSaved,
  onSplashscreenSaved,
}: SettingsPanelProps) => {
  const [catalogueKey, setCatalogueKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [accel, setAccel] = useState(overview?.settings.hardwareAccel ?? '');
  const [quality, setQuality] = useState(overview?.settings.previewQuality ?? 'high');
  const [roundness, setRoundness] = useState(overview?.settings.roundness ?? 'default');
  const [region, setRegion] = useState(overview?.settings.certificationRegion ?? 'GB');
  const [keepsDownloadsFor, setKeepsDownloadsFor] = useState(
    String(overview?.settings.keepsDownloadsForDays ?? 14),
  );
  const [showsFaces, setShowsFaces] = useState(
    overview?.settings.showsProfilesBeforeSignIn ?? true,
  );
  const [fetchesTrailers, setFetchesTrailers] = useState(
    overview?.settings.fetchesCatalogueTrailers ?? false,
  );
  const [audioDbKey, setAudioDbKey] = useState('');
  const [isSavingAudioDbKey, setIsSavingAudioDbKey] = useState(false);
  const [omdbKey, setOmdbKey] = useState('');
  const [isSavingOmdbKey, setIsSavingOmdbKey] = useState(false);
  const [fetchesMusic, setFetchesMusic] = useState(overview?.settings.fetchesMusicDetails ?? false);
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[]>([
    ...(overview?.settings.requestReleaseTypes ?? ['album']),
  ]);
  const [splashscreen, setSplashscreen] = useState(overview?.settings.splashscreen ?? null);
  const [isChangingSplashscreen, setIsChangingSplashscreen] = useState(false);
  const [splashscreenProblem, setSplashscreenProblem] = useState<string | null>(null);

  return (
    <PanelCard title={say('common.settings')} isFlush>
      <SettingList>
        <SettingRow
          title={say('screens.adminArea.settingsPanel.hardwareAcceleration')}
          description={say(
            'screens.adminArea.settingsPanel.valencePicksWhicheverBackendTheMachine',
          )}
        >
          <OptionMenu
            label={say('screens.adminArea.settingsPanel.hardwareAcceleration')}
            groups={[
              {
                name: say('screens.adminArea.settingsPanel.backend'),
                selectedId: accel,
                onSelect: (id) => {
                  setAccel(id);

                  void saveHardwareAccel(id).then((saved) => {
                    tellOutcome(
                      say('screens.adminArea.settingsPanel.hardwareEncodingSaved'),
                      failureOfAnswer(
                        saved,
                        say('screens.adminArea.settingsPanel.hardwareEncodingCouldNotBeSaved'),
                      ),
                    );
                    if (saved) {
                      onHardwareAccelSaved();
                    }
                  });
                },
                options: accelerationOptions,
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {accelerationOptions.find((option) => option.id === accel)?.label ??
                    say('common.automatic')}
                </span>

                <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="end"
            className="w-44 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.ageCertificates')}
          description={say('screens.adminArea.settingsPanel.whoseCertificatesToReadA15')}
        >
          <OptionMenu
            label={say('screens.adminArea.settingsPanel.ageCertificates')}
            groups={[
              {
                name: say('screens.adminArea.settingsPanel.country'),
                selectedId: region,
                onSelect: (id) => {
                  setRegion(id);

                  void saveCertificationRegion(id).then((saved) => {
                    tellOutcome(
                      say('screens.adminArea.settingsPanel.certificationRegionSaved'),
                      failureOfAnswer(
                        saved,
                        say('screens.adminArea.settingsPanel.theCertificationRegionCouldNotBe'),
                      ),
                    );
                    if (saved) {
                      onCertificationRegionSaved();
                    }
                  });
                },
                options: certificationRegions,
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {certificationRegions.find((option) => option.id === region)?.label ?? region}
                </span>

                <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="end"
            className="w-44 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.previewQuality')}
          description={say('screens.adminArea.settingsPanel.smallerClipsTakeLessRoomAnd')}
        >
          <SegmentedRow
            label={say('screens.adminArea.settingsPanel.previewQuality')}
            size="sm"
            tone="accent"
            items={PREVIEW_QUALITY_CHOICES}
            value={quality}
            onSelect={(id) => {
              const chosen = PreviewQualitySchema.safeParse(id);

              if (!chosen.success) {
                return;
              }

              setQuality(chosen.data);

              void savePreviewQuality(chosen.data).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.previewQualitySaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.previewQualityCouldNotBeSaved'),
                  ),
                );
                if (saved) {
                  onPreviewQualitySaved();
                }
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.preparedDownloads')}
          description={say('screens.adminArea.settingsPanel.howLongAFileMadeFor')}
        >
          <OptionMenu
            label={say('screens.adminArea.settingsPanel.preparedDownloads')}
            groups={[
              {
                name: say('screens.adminArea.settingsPanel.keptFor'),
                selectedId: keepsDownloadsFor,
                onSelect: (id) => {
                  setKeepsDownloadsFor(id);

                  void saveKeepsDownloadsForDays(Number(id)).then((saved) => {
                    tellOutcome(
                      say('screens.adminArea.settingsPanel.howLongDownloadsAreKeptSaved'),
                      failureOfAnswer(
                        saved,
                        say('screens.adminArea.settingsPanel.howLongDownloadsAreKeptCould'),
                      ),
                    );
                  });
                },
                options: downloadKeepingChoices,
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {downloadKeepingChoices.find((option) => option.id === keepsDownloadsFor)
                    ?.label ?? sayCount('common.count.days', Number(keepsDownloadsFor))}
                </span>

                <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="end"
            className="w-44 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.roundness')}
          description={say('screens.adminArea.settingsPanel.howRoundTheCornersOfEverything')}
        >
          <SegmentedRow
            label={say('screens.adminArea.settingsPanel.roundness')}
            size="sm"
            tone="accent"
            items={ROUNDNESS_CHOICES}
            value={roundness}
            onSelect={(id) => {
              const chosen = RoundnessSchema.safeParse(id);

              if (!chosen.success) {
                return;
              }

              setRoundness(chosen.data);

              void saveRoundness(chosen.data).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.roundnessSaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.roundnessCouldNotBeSaved'),
                  ),
                );
                if (saved) {
                  onRoundnessSaved?.();
                }
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.showWhoLivesHere')}
          description={say('screens.adminArea.settingsPanel.drawsTheHouseholdsFacesOnThe')}
        >
          <Switch
            label={say('screens.adminArea.settingsPanel.showWhoLivesHere')}
            isLabelHidden
            isOn={showsFaces}
            onToggle={() => {
              const next = !showsFaces;

              setShowsFaces(next);

              void saveShowsProfilesBeforeSignIn(next).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.signInScreenSaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.theSignInScreenCouldNot'),
                  ),
                );
                if (saved) {
                  onProfileVisibilitySaved();

                  return;
                }

                setShowsFaces(!next);
              });
            }}
          />
        </SettingRow>

        <div>
          <SettingRow
            title={say('screens.adminArea.settingsPanel.pictureBehindTheWayIn')}
            description={say('screens.adminArea.settingsPanel.drawnBehindTheFacesWithThe')}
          >
            {splashscreen === null ? null : (
              <img
                src={splashscreen}
                alt={say('screens.adminArea.settingsPanel.thePictureBehindTheWayIn')}
                className="h-10 w-16 rounded-md object-cover"
              />
            )}

            <FilePicker
              label={
                splashscreen === null
                  ? say('common.chooseAPicture')
                  : say('screens.adminArea.settingsPanel.replaceThePicture')
              }
              accept={SPLASHSCREEN_TYPES}
              size="sm"
              isLoading={isChangingSplashscreen}
              onPick={(file) => {
                setIsChangingSplashscreen(true);
                setSplashscreenProblem(null);

                void saveSplashscreen(file).then((answer) => {
                  setIsChangingSplashscreen(false);

                  if ('problem' in answer) {
                    setSplashscreenProblem(answer.problem);
                    tellOutcome('', answer.problem);

                    return;
                  }

                  tellOutcome(say('screens.adminArea.settingsPanel.splashscreenSaved'), null);
                  setSplashscreen(answer.splashscreen);
                  onSplashscreenSaved();
                });
              }}
            >
              <Icon of={ImageIcon} size={15} />
              {splashscreen === null ? say('common.choose') : say('common.replace')}
            </FilePicker>

            {splashscreen === null ? null : (
              <Button
                variant="secondary"
                size="sm"
                disabled={isChangingSplashscreen}
                onClick={() => {
                  setIsChangingSplashscreen(true);
                  setSplashscreenProblem(null);

                  void removeSplashscreen().then((removed) => {
                    setIsChangingSplashscreen(false);

                    tellOutcome(
                      say('screens.adminArea.settingsPanel.splashscreenRemoved'),
                      failureOfAnswer(
                        removed,
                        say('screens.adminArea.settingsPanel.theSplashscreenCouldNotBeRemoved'),
                      ),
                    );

                    if (removed) {
                      setSplashscreen(null);
                      onSplashscreenSaved();

                      return;
                    }

                    setSplashscreenProblem(
                      say('screens.adminArea.settingsPanel.thePictureCouldNotBeRemoved'),
                    );
                  });
                }}
              >
                {say('common.remove')}
              </Button>
            )}
          </SettingRow>

          {splashscreenProblem === null ? null : (
            <p
              role="alert"
              className="mx-5 mb-4 flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-text"
            >
              <Icon of={TriangleAlertIcon} size={18} tone="danger" className="mt-0.5 shrink-0" />
              {splashscreenProblem}
            </p>
          )}
        </div>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.fetchTrailersFromTheCatalogue')}
          description={say('screens.adminArea.settingsPanel.offersATrailerForTitlesThat')}
        >
          <Switch
            label={say('screens.adminArea.settingsPanel.fetchTrailersFromTheCatalogue')}
            isLabelHidden
            isOn={fetchesTrailers}
            onToggle={() => {
              const next = !fetchesTrailers;

              setFetchesTrailers(next);

              void saveFetchesCatalogueTrailers(next).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.trailerSettingSaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.theTrailerSettingCouldNotBe'),
                  ),
                );
                if (saved) {
                  onCatalogueTrailersSaved();

                  return;
                }

                setFetchesTrailers(!next);
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.fetchMusicDetailsFromTheWeb')}
          description={say('screens.adminArea.settingsPanel.looksForWhatAMusicLibrarys')}
        >
          <Switch
            label={say('screens.adminArea.settingsPanel.fetchMusicDetailsFromTheWeb')}
            isLabelHidden
            isOn={fetchesMusic}
            onToggle={() => {
              const next = !fetchesMusic;

              setFetchesMusic(next);

              void saveFetchesMusicDetails(next).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.musicDetailsSettingSaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.theMusicDetailsSettingCouldNot'),
                  ),
                );
                if (saved) {
                  onMusicDetailsSaved?.();

                  return;
                }

                setFetchesMusic(!next);
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.theAudioDBKey')}
          description={
            overview?.settings.hasAudioDbKey === true
              ? say('screens.adminArea.settingsPanel.aKeyIsSetEnteringA2')
              : say('screens.adminArea.settingsPanel.withoutOneArtistsAreLookedUp')
          }
        >
          <TextField
            label={say('screens.adminArea.settingsPanel.theAudioDBKey')}
            isLabelHidden
            type="password"
            value={audioDbKey}
            onValueChange={setAudioDbKey}
            placeholder={say('screens.adminArea.settingsPanel.pasteAKey')}
            size="sm"
            className="w-48 max-w-full"
          />

          <Button
            variant="glossy"
            size="sm"
            label={say('screens.adminArea.settingsPanel.saveTheTheAudioDBKey')}
            hasTooltip={false}
            isLoading={isSavingAudioDbKey}
            disabled={audioDbKey === ''}
            onClick={() => {
              setIsSavingAudioDbKey(true);

              void saveAudioDbKey(audioDbKey).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.theAudioDBKeySaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.theTheAudioDBKeyCouldNotBe'),
                  ),
                );
                setIsSavingAudioDbKey(false);

                if (saved) {
                  setAudioDbKey('');
                  onMusicDetailsSaved?.();
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.whatARequestForAnArtist')}
          description={say('screens.adminArea.settingsPanel.whichOfAnArtistsRecordsAre')}
        >
          <div className="w-72 max-w-full">
            <ReleaseTypeChooser
              value={releaseTypes}
              onChange={(next) => {
                const before = releaseTypes;

                setReleaseTypes(next);

                void saveRequestReleaseTypes(next).then((saved) => {
                  tellOutcome(
                    say('screens.adminArea.settingsPanel.releaseTypesSaved'),
                    failureOfAnswer(
                      saved,
                      say('screens.adminArea.settingsPanel.theReleaseTypesCouldNotBe'),
                    ),
                  );
                  if (saved) {
                    onReleaseTypesSaved?.();

                    return;
                  }

                  setReleaseTypes(before);
                });
              }}
            />
          </div>
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.metadataCatalogue')}
          description={
            overview?.settings.hasCatalogueKey === true
              ? say('screens.adminArea.settingsPanel.aKeyIsSetEnteringA2')
              : say('screens.adminArea.settingsPanel.withoutAKeyTitlesAndYears')
          }
        >
          <TextField
            label={say('screens.adminArea.settingsPanel.catalogueKey')}
            isLabelHidden
            type="password"
            value={catalogueKey}
            onValueChange={setCatalogueKey}
            placeholder={say('screens.adminArea.settingsPanel.pasteAKey')}
            size="sm"
            className="w-48 max-w-full"
          />

          <Button
            variant="glossy"
            size="sm"
            isLoading={isSaving}
            disabled={catalogueKey === ''}
            onClick={() => {
              setIsSaving(true);

              void saveCatalogueKey(catalogueKey).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.catalogueKeySaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.theCatalogueKeyCouldNotBe'),
                  ),
                );
                setIsSaving(false);

                if (saved) {
                  setCatalogueKey('');
                  onCatalogueKeySaved();
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.rottenTomatoesScores')}
          description={
            overview?.settings.hasOmdbKey === true
              ? say('screens.adminArea.settingsPanel.aKeyIsSetEnteringA')
              : say('screens.adminArea.settingsPanel.optionalAFreeOMDbKeyAdds')
          }
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open('https://www.omdbapi.com/apikey.aspx', '_blank', 'noopener,noreferrer');
            }}
          >
            {say('common.getAFreeKey')}
          </Button>

          <TextField
            label={say('screens.adminArea.settingsPanel.oMDbKey')}
            isLabelHidden
            type="password"
            value={omdbKey}
            onValueChange={setOmdbKey}
            placeholder={say('screens.adminArea.settingsPanel.pasteAKey')}
            size="sm"
            className="w-48 max-w-full"
          />

          <Button
            variant="glossy"
            size="sm"
            label={say('screens.adminArea.settingsPanel.saveTheOMDbKey')}
            hasTooltip={false}
            isLoading={isSavingOmdbKey}
            disabled={omdbKey === ''}
            onClick={() => {
              setIsSavingOmdbKey(true);

              void saveOmdbKey(omdbKey).then((saved) => {
                tellOutcome(
                  say('screens.adminArea.settingsPanel.oMDbKeySaved'),
                  failureOfAnswer(
                    saved,
                    say('screens.adminArea.settingsPanel.theOMDbKeyCouldNotBe'),
                  ),
                );
                setIsSavingOmdbKey(false);

                if (saved) {
                  setOmdbKey('');
                  onCatalogueKeySaved();
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.settingsPanel.signingIn')}
          description={
            overview === null
              ? ''
              : say('screens.adminArea.settingsPanel.originsAllowedToSignInValue', {
                  value: overview.settings.trustedOrigins.join(', '),
                })
          }
        >
          {overview === null ? null : (
            <Badge tone={overview.settings.cookieSecure ? 'success' : 'warning'}>
              {overview.settings.cookieSecure
                ? say('screens.adminArea.settingsPanel.secure')
                : say('screens.adminArea.settingsPanel.notSecure')}
            </Badge>
          )}
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

SettingsPanel.displayName = 'SettingsPanel';

export { SettingsPanel };
