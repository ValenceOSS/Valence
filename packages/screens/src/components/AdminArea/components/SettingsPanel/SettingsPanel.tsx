import { Icon } from '@ValenceUI/Icon';
import { Alert02Icon, Image01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
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
  saveCatalogueKey,
  saveHardwareAccel,
  savePreviewQuality,
  saveRoundness,
  saveShowsProfilesBeforeSignIn,
  saveFetchesCatalogueTrailers,
  saveFetchesMusicDetails,
  saveRequestReleaseTypes,
  saveAudioDbKey,
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
  { id: 'low', label: 'Low' },
  { id: 'standard', label: 'Standard' },
  { id: 'high', label: 'High' },
] as const;

const SPLASHSCREEN_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { certificationRegions } from '@ValenceScreens/components/AdminArea/certificationRegions';
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
  const [showsFaces, setShowsFaces] = useState(
    overview?.settings.showsProfilesBeforeSignIn ?? true,
  );
  const [fetchesTrailers, setFetchesTrailers] = useState(
    overview?.settings.fetchesCatalogueTrailers ?? false,
  );
  const [audioDbKey, setAudioDbKey] = useState('');
  const [isSavingAudioDbKey, setIsSavingAudioDbKey] = useState(false);
  const [fetchesMusic, setFetchesMusic] = useState(overview?.settings.fetchesMusicDetails ?? false);
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[]>([
    ...(overview?.settings.requestReleaseTypes ?? ['album']),
  ]);
  const [splashscreen, setSplashscreen] = useState(overview?.settings.splashscreen ?? null);
  const [isChangingSplashscreen, setIsChangingSplashscreen] = useState(false);
  const [splashscreenProblem, setSplashscreenProblem] = useState<string | null>(null);

  return (
    <PanelCard title="Settings" isFlush>
      <SettingList>
        <SettingRow
          title="Hardware acceleration"
          description="Valence picks whichever backend the machine proves it can use. Choose one to insist, which also uses an encoder that failed that check — for when the check is wrong and the card plainly works."
        >
          <OptionMenu
            label="Hardware acceleration"
            groups={[
              {
                name: 'Backend',
                selectedId: accel,
                onSelect: (id) => {
                  setAccel(id);

                  void saveHardwareAccel(id).then((saved) => {
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
                  {accelerationOptions.find((option) => option.id === accel)?.label ?? 'Automatic'}
                </span>

                <Icon of={UnfoldMoreIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="end"
            className="w-44 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title="Age certificates"
          description="Whose certificates to read. A 15 and an R are not the same thing, so Valence orders them within one country rather than pretending they map onto each other. Every country's certificates are already stored, so changing this reads them again rather than rescanning."
        >
          <OptionMenu
            label="Age certificates"
            groups={[
              {
                name: 'Country',
                selectedId: region,
                onSelect: (id) => {
                  setRegion(id);

                  void saveCertificationRegion(id).then((saved) => {
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

                <Icon of={UnfoldMoreIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="end"
            className="w-44 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title="Preview quality"
          description="Smaller clips take less room and less time to make; sharper ones hold up across the hero. Changing it makes every preview again in the background."
        >
          <SegmentedRow
            label="Preview quality"
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
                if (saved) {
                  onPreviewQualitySaved();
                }
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title="Roundness"
          description="How round the corners of everything in Valence are, for everybody who uses this server. Sharp squares them all off; round softens them."
        >
          <SegmentedRow
            label="Roundness"
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
                if (saved) {
                  onRoundnessSaved?.();
                }
              });
            }}
          />
        </SettingRow>

        <SettingRow
          title="Show who lives here"
          description="Draws the household's faces on the way in, so somebody signs in by picking one. Off, the way in asks for an address and a password instead, and nobody who has not signed in can read the names, pictures or identifiers of the people here."
        >
          <Switch
            label="Show who lives here"
            isLabelHidden
            isOn={showsFaces}
            onToggle={() => {
              const next = !showsFaces;

              setShowsFaces(next);

              void saveShowsProfilesBeforeSignIn(next).then((saved) => {
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
            title="Picture behind the way in"
            description="Drawn behind the faces, with the colour of whoever is chosen still washing over it. Only somebody who may see the faces sees it, so it shows while Show who lives here is on. JPEG, PNG, WebP, AVIF or GIF, up to 16 MB."
          >
            {splashscreen === null ? null : (
              <img
                src={splashscreen}
                alt="The picture behind the way in"
                className="h-10 w-16 rounded-md object-cover"
              />
            )}

            <FilePicker
              label={splashscreen === null ? 'Choose a picture' : 'Replace the picture'}
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

                    return;
                  }

                  setSplashscreen(answer.splashscreen);
                  onSplashscreenSaved();
                });
              }}
            >
              <Icon of={Image01Icon} size={15} />
              {splashscreen === null ? 'Choose' : 'Replace'}
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

                    if (removed) {
                      setSplashscreen(null);
                      onSplashscreenSaved();

                      return;
                    }

                    setSplashscreenProblem('The picture could not be removed. Try again.');
                  });
                }}
              >
                Remove
              </Button>
            )}
          </SettingRow>

          {splashscreenProblem === null ? null : (
            <p
              role="alert"
              className="mx-5 mb-4 flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-text"
            >
              <Icon of={Alert02Icon} size={18} tone="danger" className="mt-0.5 shrink-0" />
              {splashscreenProblem}
            </p>
          )}
        </div>

        <SettingRow
          title="Fetch trailers from the catalogue"
          description="Offers a trailer for titles that have none on disk, played in a frame from the video host the catalogue points at. That is the one thing Valence does that reaches outside this server, which is why it is off until you say otherwise. A trailer already beside the file is always used instead."
        >
          <Switch
            label="Fetch trailers from the catalogue"
            isLabelHidden
            isOn={fetchesTrailers}
            onToggle={() => {
              const next = !fetchesTrailers;

              setFetchesTrailers(next);

              void saveFetchesCatalogueTrailers(next).then((saved) => {
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
          title="Fetch music details from the web"
          description="Looks for what a music library's files left out: album covers on the Cover Art Archive, artists' photographs and music videos on TheAudioDB, and song words on LRCLIB. Each album, artist and song is asked about once, on the next scan, and nothing a file already carries is replaced. Like trailers, it reaches outside this server, so it is off until you say otherwise."
        >
          <Switch
            label="Fetch music details from the web"
            isLabelHidden
            isOn={fetchesMusic}
            onToggle={() => {
              const next = !fetchesMusic;

              setFetchesMusic(next);

              void saveFetchesMusicDetails(next).then((saved) => {
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
          title="TheAudioDB key"
          description={
            overview?.settings.hasAudioDbKey === true
              ? 'A key is set. Entering a new one replaces it.'
              : 'Without one, artists are looked up with the free key, which finds only one music video for each artist.'
          }
        >
          <TextField
            label="TheAudioDB key"
            isLabelHidden
            type="password"
            value={audioDbKey}
            onValueChange={setAudioDbKey}
            placeholder="Paste a key"
            size="sm"
            className="w-48 max-w-full"
          />

          <Button
            variant="glossy"
            size="sm"
            label="Save the TheAudioDB key"
            hasTooltip={false}
            isLoading={isSavingAudioDbKey}
            disabled={audioDbKey === ''}
            onClick={() => {
              setIsSavingAudioDbKey(true);

              void saveAudioDbKey(audioDbKey).then((saved) => {
                setIsSavingAudioDbKey(false);

                if (saved) {
                  setAudioDbKey('');
                  onMusicDetailsSaved?.();
                }
              });
            }}
          >
            Save
          </Button>
        </SettingRow>

        <SettingRow
          title="What a request for an artist watches"
          description="Which of an artist's records are fetched where whoever asked did not say — their albums, and whatever else this household keeps. It can be changed on any one request."
        >
          <div className="w-72 max-w-full">
            <ReleaseTypeChooser
              value={releaseTypes}
              onChange={(next) => {
                const before = releaseTypes;

                setReleaseTypes(next);

                void saveRequestReleaseTypes(next).then((saved) => {
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
          title="Metadata catalogue"
          description={
            overview?.settings.hasCatalogueKey === true
              ? 'A key is set. Entering a new one replaces it.'
              : 'Without a key, titles and years come from filenames alone.'
          }
        >
          <TextField
            label="Catalogue key"
            isLabelHidden
            type="password"
            value={catalogueKey}
            onValueChange={setCatalogueKey}
            placeholder="Paste a key"
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
                setIsSaving(false);

                if (saved) {
                  setCatalogueKey('');
                  onCatalogueKeySaved();
                }
              });
            }}
          >
            Save
          </Button>
        </SettingRow>

        <SettingRow
          title="Signing in"
          description={
            overview === null
              ? ''
              : `Origins allowed to sign in: ${overview.settings.trustedOrigins.join(', ')}.`
          }
        >
          {overview === null ? null : (
            <Badge tone={overview.settings.cookieSecure ? 'success' : 'warning'}>
              {overview.settings.cookieSecure ? 'secure' : 'not secure'}
            </Badge>
          )}
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

SettingsPanel.displayName = 'SettingsPanel';

export { SettingsPanel };
