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
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { SettingsPanelProps } from './SettingsPanel.types';

const PREVIEW_QUALITY_CHOICES = [
  { id: 'low', labelKey: 'admin.settingsPanel.previewQuality.low' },
  { id: 'standard', labelKey: 'admin.settingsPanel.previewQuality.standard' },
  { id: 'high', labelKey: 'admin.settingsPanel.previewQuality.high' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

const SPLASHSCREEN_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { certificationRegions } from '@ValenceScreens/components/AdminArea/certificationRegions';
import { downloadKeepingChoices } from '@ValenceScreens/components/AdminArea/downloadKeepingChoices';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

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
  const accelKey = accelerationOptions.find((option) => option.id === accel)?.labelKey;
  const regionKey = certificationRegions.find((option) => option.id === region)?.labelKey;
  const keepingKey = downloadKeepingChoices.find(
    (option) => option.id === keepsDownloadsFor,
  )?.labelKey;

  return (
    <PanelCard title={say('admin.settingsPanel.heading')} isFlush>
      <SettingList>
        <SettingRow
          title={say('admin.settingsPanel.hardware.title')}
          description={say('admin.settingsPanel.hardware.description')}
        >
          <OptionMenu
            label={say('admin.settingsPanel.hardware.title')}
            groups={[
              {
                name: say('admin.settingsPanel.hardware.group'),
                selectedId: accel,
                onSelect: (id) => {
                  setAccel(id);

                  void saveHardwareAccel(id).then((saved) => {
                    tellOutcome(
                      say('admin.settingsPanel.hardware.saved'),
                      failureOfAnswer(saved, say('admin.settingsPanel.hardware.couldNotSave')),
                    );
                    if (saved) {
                      onHardwareAccelSaved();
                    }
                  });
                },
                options: accelerationOptions.map(({ id, labelKey, detailKey }) => ({
                  id,
                  label: say(labelKey),
                  detail: say(detailKey),
                })),
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {say(accelKey ?? 'admin.settingsPanel.hardware.automatic')}
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
          title={say('admin.settingsPanel.certificates.title')}
          description={say('admin.settingsPanel.certificates.description')}
        >
          <OptionMenu
            label={say('admin.settingsPanel.certificates.title')}
            groups={[
              {
                name: say('admin.settingsPanel.certificates.group'),
                selectedId: region,
                onSelect: (id) => {
                  setRegion(id);

                  void saveCertificationRegion(id).then((saved) => {
                    tellOutcome(
                      say('admin.settingsPanel.certificates.saved'),
                      failureOfAnswer(saved, say('admin.settingsPanel.certificates.couldNotSave')),
                    );
                    if (saved) {
                      onCertificationRegionSaved();
                    }
                  });
                },
                options: certificationRegions.map(({ id, labelKey, detailKey }) => ({
                  id,
                  label: say(labelKey),
                  detail: say(detailKey),
                })),
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {regionKey === undefined ? region : say(regionKey)}
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
          title={say('admin.settingsPanel.previewQuality.title')}
          description={say('admin.settingsPanel.previewQuality.description')}
        >
          <SegmentedRow
            label={say('admin.settingsPanel.previewQuality.title')}
            size="sm"
            tone="accent"
            items={PREVIEW_QUALITY_CHOICES.map(({ id, labelKey }) => ({
              id,
              label: say(labelKey),
            }))}
            value={quality}
            onSelect={(id) => {
              const chosen = PreviewQualitySchema.safeParse(id);

              if (!chosen.success) {
                return;
              }

              setQuality(chosen.data);

              void savePreviewQuality(chosen.data).then((saved) => {
                tellOutcome(
                  say('admin.settingsPanel.previewQuality.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.previewQuality.couldNotSave')),
                );
                if (saved) {
                  onPreviewQualitySaved();
                }
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('admin.settingsPanel.downloads.title')}
          description={say('admin.settingsPanel.downloads.description')}
        >
          <OptionMenu
            label={say('admin.settingsPanel.downloads.title')}
            groups={[
              {
                name: say('admin.settingsPanel.downloads.group'),
                selectedId: keepsDownloadsFor,
                onSelect: (id) => {
                  setKeepsDownloadsFor(id);

                  void saveKeepsDownloadsForDays(Number(id)).then((saved) => {
                    tellOutcome(
                      say('admin.settingsPanel.downloads.saved'),
                      failureOfAnswer(saved, say('admin.settingsPanel.downloads.couldNotSave')),
                    );
                  });
                },
                options: downloadKeepingChoices.map(({ id, labelKey }) => ({
                  id,
                  label: say(labelKey),
                })),
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {keepingKey === undefined
                    ? sayCount('admin.settingsPanel.downloads.days', Number(keepsDownloadsFor))
                    : say(keepingKey)}
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
          title={say('admin.settingsPanel.roundness.title')}
          description={say('admin.settingsPanel.roundness.description')}
        >
          <SegmentedRow
            label={say('admin.settingsPanel.roundness.title')}
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
                  say('admin.settingsPanel.roundness.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.roundness.couldNotSave')),
                );
                if (saved) {
                  onRoundnessSaved?.();
                }
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('admin.settingsPanel.faces.title')}
          description={say('admin.settingsPanel.faces.description')}
        >
          <Switch
            label={say('admin.settingsPanel.faces.title')}
            isLabelHidden
            isOn={showsFaces}
            onToggle={() => {
              const next = !showsFaces;

              setShowsFaces(next);

              void saveShowsProfilesBeforeSignIn(next).then((saved) => {
                tellOutcome(
                  say('admin.settingsPanel.faces.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.faces.couldNotSave')),
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
            title={say('admin.settingsPanel.splashscreen.title')}
            description={say('admin.settingsPanel.splashscreen.description')}
          >
            {splashscreen === null ? null : (
              <img
                src={splashscreen}
                alt={say('admin.settingsPanel.splashscreen.alt')}
                className="h-10 w-16 rounded-md object-cover"
              />
            )}

            <FilePicker
              label={
                splashscreen === null
                  ? say('admin.settingsPanel.splashscreen.chooseLabel')
                  : say('admin.settingsPanel.splashscreen.replaceLabel')
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

                  tellOutcome(say('admin.settingsPanel.splashscreen.saved'), null);
                  setSplashscreen(answer.splashscreen);
                  onSplashscreenSaved();
                });
              }}
            >
              <Icon of={ImageIcon} size={15} />
              {splashscreen === null
                ? say('admin.settingsPanel.splashscreen.choose')
                : say('admin.settingsPanel.splashscreen.replace')}
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
                      say('admin.settingsPanel.splashscreen.removed'),
                      failureOfAnswer(
                        removed,
                        say('admin.settingsPanel.splashscreen.couldNotRemove'),
                      ),
                    );

                    if (removed) {
                      setSplashscreen(null);
                      onSplashscreenSaved();

                      return;
                    }

                    setSplashscreenProblem(
                      say('admin.settingsPanel.splashscreen.couldNotRemoveTryAgain'),
                    );
                  });
                }}
              >
                {say('admin.settingsPanel.splashscreen.remove')}
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
          title={say('admin.settingsPanel.trailers.title')}
          description={say('admin.settingsPanel.trailers.description')}
        >
          <Switch
            label={say('admin.settingsPanel.trailers.title')}
            isLabelHidden
            isOn={fetchesTrailers}
            onToggle={() => {
              const next = !fetchesTrailers;

              setFetchesTrailers(next);

              void saveFetchesCatalogueTrailers(next).then((saved) => {
                tellOutcome(
                  say('admin.settingsPanel.trailers.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.trailers.couldNotSave')),
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
          title={say('admin.settingsPanel.musicDetails.title')}
          description={say('admin.settingsPanel.musicDetails.description')}
        >
          <Switch
            label={say('admin.settingsPanel.musicDetails.title')}
            isLabelHidden
            isOn={fetchesMusic}
            onToggle={() => {
              const next = !fetchesMusic;

              setFetchesMusic(next);

              void saveFetchesMusicDetails(next).then((saved) => {
                tellOutcome(
                  say('admin.settingsPanel.musicDetails.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.musicDetails.couldNotSave')),
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
          title={say('admin.settingsPanel.audioDb.title')}
          description={
            overview?.settings.hasAudioDbKey === true
              ? say('admin.settingsPanel.keyIsSet')
              : say('admin.settingsPanel.audioDb.noKey')
          }
        >
          <TextField
            label={say('admin.settingsPanel.audioDb.title')}
            isLabelHidden
            type="password"
            value={audioDbKey}
            onValueChange={setAudioDbKey}
            placeholder={say('admin.settingsPanel.pasteKey')}
            size="sm"
            className="w-48 max-w-full"
          />

          <Button
            variant="glossy"
            size="sm"
            label={say('admin.settingsPanel.audioDb.saveLabel')}
            hasTooltip={false}
            isLoading={isSavingAudioDbKey}
            disabled={audioDbKey === ''}
            onClick={() => {
              setIsSavingAudioDbKey(true);

              void saveAudioDbKey(audioDbKey).then((saved) => {
                tellOutcome(
                  say('admin.settingsPanel.audioDb.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.audioDb.couldNotSave')),
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
          title={say('admin.settingsPanel.releaseTypes.title')}
          description={say('admin.settingsPanel.releaseTypes.description')}
        >
          <div className="w-72 max-w-full">
            <ReleaseTypeChooser
              value={releaseTypes}
              onChange={(next) => {
                const before = releaseTypes;

                setReleaseTypes(next);

                void saveRequestReleaseTypes(next).then((saved) => {
                  tellOutcome(
                    say('admin.settingsPanel.releaseTypes.saved'),
                    failureOfAnswer(saved, say('admin.settingsPanel.releaseTypes.couldNotSave')),
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
          title={say('admin.settingsPanel.catalogue.title')}
          description={
            overview?.settings.hasCatalogueKey === true
              ? say('admin.settingsPanel.keyIsSet')
              : say('admin.settingsPanel.catalogue.noKey')
          }
        >
          <TextField
            label={say('admin.settingsPanel.catalogue.keyLabel')}
            isLabelHidden
            type="password"
            value={catalogueKey}
            onValueChange={setCatalogueKey}
            placeholder={say('admin.settingsPanel.pasteKey')}
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
                  say('admin.settingsPanel.catalogue.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.catalogue.couldNotSave')),
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
          title={say('admin.settingsPanel.omdb.title')}
          description={
            overview?.settings.hasOmdbKey === true
              ? say('admin.settingsPanel.omdb.keyIsSet')
              : say('admin.settingsPanel.omdb.noKey')
          }
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open('https://www.omdbapi.com/apikey.aspx', '_blank', 'noopener,noreferrer');
            }}
          >
            {say('admin.settingsPanel.omdb.getKey')}
          </Button>

          <TextField
            label={say('admin.settingsPanel.omdb.keyLabel')}
            isLabelHidden
            type="password"
            value={omdbKey}
            onValueChange={setOmdbKey}
            placeholder={say('admin.settingsPanel.pasteKey')}
            size="sm"
            className="w-48 max-w-full"
          />

          <Button
            variant="glossy"
            size="sm"
            label={say('admin.settingsPanel.omdb.saveLabel')}
            hasTooltip={false}
            isLoading={isSavingOmdbKey}
            disabled={omdbKey === ''}
            onClick={() => {
              setIsSavingOmdbKey(true);

              void saveOmdbKey(omdbKey).then((saved) => {
                tellOutcome(
                  say('admin.settingsPanel.omdb.saved'),
                  failureOfAnswer(saved, say('admin.settingsPanel.omdb.couldNotSave')),
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
          title={say('admin.settingsPanel.signingIn.title')}
          description={
            overview === null
              ? ''
              : say('admin.settingsPanel.signingIn.origins', {
                  origins: overview.settings.trustedOrigins.join(', '),
                })
          }
        >
          {overview === null ? null : (
            <Badge tone={overview.settings.cookieSecure ? 'success' : 'warning'}>
              {overview.settings.cookieSecure
                ? say('admin.settingsPanel.signingIn.secure')
                : say('admin.settingsPanel.signingIn.notSecure')}
            </Badge>
          )}
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

SettingsPanel.displayName = 'SettingsPanel';

export { SettingsPanel };
