import { notify } from '@ValenceUI/notify';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import {
  MUSIC_QUALITIES,
  RELEASE_SOURCES,
  RESOLUTIONS,
} from '@ValenceContracts/schemas/ParsedRelease';
import { LANGUAGE_NAMES } from '@ValenceCore/functions/describeTrack';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { addProfile, changeProfile } from '@ValenceClient/requests/fetchProfiles';
import { QualitySizes } from '@ValenceScreens/components/AdminArea/components/ProfileEditor/components/QualitySizes/QualitySizes';
import { AskerPicker } from '@ValenceScreens/components/AdminArea/components/AskerPicker/AskerPicker';
import { RankedChoices } from '@ValenceScreens/components/AdminArea/components/RankedChoices/RankedChoices';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import { formFor, readProfileForm } from './readProfileForm';
import type { ProfileKind, ReleaseWait } from '@ValenceContracts/schemas/QualityProfile';
import type { ProfileForm, ProfileTab } from './readProfileForm';
import type { ProfileEditorProps } from './ProfileEditor.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const TABS: readonly { id: ProfileTab; label: string }[] = [
  { id: 'quality', label: say('common.quality') },
  { id: 'matching', label: say('screens.adminArea.profileEditor.matching') },
  { id: 'access', label: say('common.access') },
];

/**
 * Whether a tab name is one of this dialog's.
 *
 * @param value - What the tabs said.
 * @returns Whether it names a tab.
 */
const isProfileTab = (value: string): value is ProfileTab => TABS.some((tab) => tab.id === value);

const KINDS: readonly { id: ProfileKind; label: string }[] = [
  { id: 'video', label: say('common.filmsAndSeries') },
  { id: 'music', label: say('common.music') },
];

const LANGUAGES: readonly { id: string; label: string }[] = Object.entries(LANGUAGE_NAMES)
  .map(([id, label]) => ({ id, label }))
  .toSorted((left, right) => left.label.localeCompare(right.label));

const WAITS: readonly { id: ReleaseWait; label: string }[] = [
  { id: 'digital', label: say('screens.adminArea.profileEditor.outDigitally') },
  { id: 'physical', label: say('screens.adminArea.profileEditor.outOnDisc') },
];

/**
 * One part of the profile page, under a heading of its own.
 *
 * @param title - What the part is.
 * @param detail - What it decides.
 * @param children - Its fields.
 * @returns The part.
 */
const Section = ({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) => (
  <section
    aria-label={title}
    className="flex flex-col gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0"
  >
    <header className="flex flex-col gap-1">
      <h4 className="text-sm font-semibold text-text">{title}</h4>
      {detail === undefined ? null : <p className="font-body text-sm text-text-muted">{detail}</p>}
    </header>
    {children}
  </section>
);

Section.displayName = 'Section';

/**
 * Names each value the way the form shows it.
 *
 * @param values - The values.
 * @returns The options.
 */
const optionsOf = <Value extends keyof typeof QUALITY_NAMES>(values: readonly Value[]) =>
  values.map((id) => ({ id, label: QUALITY_NAMES[id] }));

/**
 * One choice from a short list, shown as a field.
 *
 * @param label - What the choice is.
 * @param value - What is chosen, or null.
 * @param options - What can be chosen.
 * @param onChoose - Told what was chosen.
 * @returns The field.
 */
const Choosing = <Value extends string>({
  label,
  value,
  options,
  onChoose,
  anything = say('screens.adminArea.profileEditor.theBestThereIs'),
}: {
  label: string;
  value: Value | null;
  options: readonly { id: Value; label: string }[];
  onChoose: (value: Value | null) => void;
  anything?: string;
}) => (
  <FormField label={label}>
    <OptionMenu
      label={label}
      triggerShape="field"
      matchTriggerWidth
      groups={[
        {
          name: label,
          selectedId: value ?? 'any',
          onSelect: (next) => {
            onChoose(options.find((option) => option.id === next)?.id ?? null);
          },
          options: [{ id: 'any', label: anything }, ...options],
        },
      ]}
      trigger={
        <>
          <span className="truncate">
            {options.find((option) => option.id === value)?.label ?? anything}
          </span>
          <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
        </>
      }
    />
  </FormField>
);

Choosing.displayName = 'Choosing';

/**
 * The dialog for adding a quality profile, or changing one already kept: for films and series, which
 * resolutions and sources may be taken, best first, how large a release of each quality may be an
 * hour, and whether a film is held until it is out digitally or on disc; for music, which formats,
 * and how large an album. Words can be preferred, required or banned, a language can be preferred,
 * it can say whether to upgrade later and up to what, who may ask with it, and which libraries it
 * is for.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param profile - The profile being changed, or null to add one.
 * @param onClose - Called when the dialog is dismissed.
 * @param onSaved - Called with the profile as kept.
 */
const ProfileEditor = ({ isOpen, profile, onClose, onSaved }: ProfileEditorProps) => {
  const libraries = useQuery(libraryQueries.all());
  const roles = useQuery(adminQueries.roles());
  const accounts = useQuery(adminQueries.accounts());
  const [form, setForm] = useState<ProfileForm>(() => formFor(profile));
  const [shownFor, setShownFor] = useState(profile);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('quality');

  if (shownFor !== profile) {
    setShownFor(profile);
    setForm(formFor(profile));
    setProblem(null);
  }

  const change = (next: Partial<ProfileForm>) => {
    setForm((current) => ({ ...current, ...next }));
    setProblem(null);
  };

  const isVideo = form.kind === 'video';
  const forKind = (libraries.data ?? []).filter((library) =>
    isVideo ? library.kind === 'movies' || library.kind === 'shows' : library.kind === 'music',
  );

  const save = () => {
    const outcome = readProfileForm(form);

    if (outcome.draft === null) {
      setProblem(outcome.problem);
      setTab(outcome.at);

      return;
    }

    setIsSaving(true);

    void (profile === null ? addProfile(outcome.draft) : changeProfile(profile.id, outcome.draft))
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('common.thatCouldNotBeSaved'));

          return;
        }

        notify.worked(
          profile === null
            ? say('common.addedName', { name: value.name })
            : say('common.savedName', { name: value.name }),
        );
        onSaved(value);
        onClose();
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const title =
    profile === null
      ? say('common.addMediaProfile')
      : say('common.changeName', { name: profile.name });

  return (
    <Dialog label={title} isOpen={isOpen} onClose={onClose} size="stage">
      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isProfileTab(next)) {
            setTab(next);
          }
        }}
      >
        <DialogTitle
          title={title}
          detail={say('screens.adminArea.profileEditor.everyReleaseASearchFindsIs')}
          below={
            <TabRow
              label={say('screens.adminArea.profileEditor.whichPartOfTheProfileTo')}
              tone="underlined"
              size="sm"
              value={tab}
              groups={[{ items: TABS.map(({ id, label }) => ({ id, label })) }]}
            />
          }
        />

        <DialogContent>
          <TabPanel value="quality" className="flex w-full flex-col gap-6">
            <Section title={say('common.profile')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={say('common.name')}
                  value={form.name}
                  onValueChange={(name) => {
                    change({ name });
                  }}
                  placeholder={
                    isVideo ? say('screens.adminArea.profileEditor.hD') : say('common.lossless')
                  }
                  required
                />

                <FormField label={say('screens.adminArea.profileEditor.for')}>
                  <SegmentedRow
                    label={say('screens.adminArea.profileEditor.for')}
                    size="sm"
                    items={KINDS}
                    value={form.kind}
                    onSelect={(next) => {
                      const kind = KINDS.find((one) => one.id === next)?.id;

                      if (kind !== undefined) {
                        change({ kind, libraryIds: [] });
                      }
                    }}
                  />
                </FormField>
              </div>
            </Section>

            <Section
              title={say('screens.adminArea.profileEditor.whatItTakes')}
              detail={say('screens.adminArea.profileEditor.tickWhatMayBeTakenBest')}
            >
              {isVideo ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={say('screens.adminArea.profileEditor.resolutions')}>
                    <RankedChoices
                      label={say('screens.adminArea.profileEditor.resolutions')}
                      options={optionsOf(RESOLUTIONS)}
                      chosen={form.resolutions}
                      onChange={(resolutions) => {
                        change({ resolutions });
                      }}
                    />
                  </FormField>

                  <FormField
                    label={say('screens.adminArea.profileEditor.sources')}
                    description={say('screens.adminArea.profileEditor.aReleaseThatDoesNotSay')}
                  >
                    <RankedChoices
                      label={say('screens.adminArea.profileEditor.sources')}
                      options={optionsOf(RELEASE_SOURCES)}
                      chosen={form.sources}
                      onChange={(sources) => {
                        change({ sources });
                      }}
                    />
                  </FormField>
                </div>
              ) : (
                <FormField label={say('screens.adminArea.profileEditor.formats')}>
                  <RankedChoices
                    label={say('screens.adminArea.profileEditor.formats')}
                    options={optionsOf(MUSIC_QUALITIES)}
                    chosen={form.musicQualities}
                    onChange={(musicQualities) => {
                      change({ musicQualities });
                    }}
                  />
                </FormField>
              )}
            </Section>

            <Section
              title={say('screens.adminArea.profileEditor.sizes')}
              detail={
                isVideo
                  ? say('screens.adminArea.profileEditor.howLargeAReleaseOfEach')
                  : say('screens.adminArea.profileEditor.howLargeAnAlbumMayBe')
              }
            >
              {isVideo ? (
                <QualitySizes
                  resolutions={form.resolutions}
                  sources={form.sources}
                  sizes={form.sizes}
                  onChange={(sizes) => {
                    change({ sizes });
                  }}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label={say('screens.adminArea.profileEditor.smallestMBAnAlbum')}
                    type="number"
                    min={0}
                    value={form.smallestMb}
                    onValueChange={(smallestMb) => {
                      change({ smallestMb });
                    }}
                    placeholder={say('common.noLimit')}
                  />

                  <TextField
                    label={say('screens.adminArea.profileEditor.largestMBAnAlbum')}
                    type="number"
                    min={1}
                    value={form.largestMb}
                    onValueChange={(largestMb) => {
                      change({ largestMb });
                    }}
                    placeholder={say('common.noLimit')}
                  />
                </div>
              )}
            </Section>
          </TabPanel>

          <TabPanel value="matching" className="flex w-full flex-col gap-6">
            {isVideo ? (
              <Section
                title={say('common.films')}
                detail={say('screens.adminArea.profileEditor.aFilmIsHeldUntilThen')}
              >
                <FormField label={say('screens.adminArea.profileEditor.searchFilmsOnceTheyAre')}>
                  <SegmentedRow
                    label={say('screens.adminArea.profileEditor.searchFilmsOnceTheyAre')}
                    size="sm"
                    items={WAITS}
                    value={form.releaseWait}
                    onSelect={(next) => {
                      const releaseWait = WAITS.find((one) => one.id === next)?.id;

                      if (releaseWait !== undefined) {
                        change({ releaseWait });
                      }
                    }}
                  />
                </FormField>
              </Section>
            ) : null}

            <Section title={say('common.words')}>
              <TextField
                label={say('screens.adminArea.profileEditor.preferredWords')}
                value={form.preferredWords}
                onValueChange={(preferredWords) => {
                  change({ preferredWords });
                }}
                description={say('screens.adminArea.profileEditor.eachOneAReleaseHasAdds')}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={say('screens.adminArea.profileEditor.requiredWords')}
                  value={form.requiredWords}
                  onValueChange={(requiredWords) => {
                    change({ requiredWords });
                  }}
                  description={say('screens.adminArea.profileEditor.aReleaseNeedsAtLeastOne')}
                />

                <TextField
                  label={say('screens.adminArea.profileEditor.bannedWords')}
                  value={form.bannedWords}
                  onValueChange={(bannedWords) => {
                    change({ bannedWords });
                  }}
                  description={say('screens.adminArea.profileEditor.aReleaseWithAnyIsRefused')}
                />
              </div>
            </Section>

            <Section title={say('common.upgrades')}>
              <Switch
                label={say('screens.adminArea.profileEditor.upgradeToABetterReleaseLater')}
                isOn={form.isUpgrading}
                onToggle={() => {
                  change({ isUpgrading: !form.isUpgrading });
                }}
              />

              {!form.isUpgrading ? null : isVideo ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Choosing
                    label={say('screens.adminArea.profileEditor.untilTheResolutionIs')}
                    value={form.upgradeUntilResolution}
                    options={optionsOf(form.resolutions)}
                    onChoose={(upgradeUntilResolution) => {
                      change({ upgradeUntilResolution });
                    }}
                  />

                  <Choosing
                    label={say('screens.adminArea.profileEditor.andTheSourceIs')}
                    value={form.upgradeUntilSource}
                    options={optionsOf(form.sources)}
                    onChoose={(upgradeUntilSource) => {
                      change({ upgradeUntilSource });
                    }}
                  />
                </div>
              ) : (
                <Choosing
                  label={say('screens.adminArea.profileEditor.untilTheFormatIs')}
                  value={form.upgradeUntilMusicQuality}
                  options={optionsOf(form.musicQualities)}
                  onChoose={(upgradeUntilMusicQuality) => {
                    change({ upgradeUntilMusicQuality });
                  }}
                />
              )}
            </Section>

            <Section
              title={say('common.language')}
              detail={say('screens.adminArea.profileEditor.prefersReleasesThatSayTheyAre')}
            >
              <Choosing
                label={say('screens.adminArea.profileEditor.preferredLanguage')}
                value={form.preferredLanguage}
                options={LANGUAGES}
                onChoose={(preferredLanguage) => {
                  change({ preferredLanguage });
                }}
                anything={say('screens.adminArea.profileEditor.useTheLibrarysLanguage')}
              />
            </Section>
          </TabPanel>

          <TabPanel value="access" className="flex w-full flex-col gap-6">
            <Section
              title={say('common.whoCanUseIt')}
              detail={say('screens.adminArea.profileEditor.leaveBothEmptyAndAnyoneCan')}
            >
              <Switch
                label={say('screens.adminArea.profileEditor.alwaysUseThisProfile')}
                isOn={form.isDefault}
                onToggle={() => {
                  change({ isDefault: !form.isDefault });
                }}
              />

              <p className="font-body text-sm text-text-muted">
                {form.isDefault
                  ? isVideo
                    ? say('screens.adminArea.profileEditor.everyFilmAndSeriesRequestUsesThis')
                    : say('screens.adminArea.profileEditor.everyMusicRequestUsesThis')
                  : say('screens.adminArea.profileEditor.leaveOffToLetPeoplePick')}
              </p>

              {form.isDefault ? null : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <AskerPicker
                    legend={say('common.roles')}
                    everyLabel={say('screens.adminArea.profileEditor.anyRole')}
                    askers={(roles.data ?? []).map((role) => ({ id: role.id, name: role.name }))}
                    chosen={new Set(form.roleIds)}
                    onChange={(chosen) => {
                      change({ roleIds: [...chosen] });
                    }}
                  />

                  <AskerPicker
                    legend={say('common.people')}
                    everyLabel={say('common.anybody')}
                    askers={(accounts.data ?? []).map((account) => ({
                      id: account.id,
                      name: account.name,
                      detail: account.email,
                    }))}
                    chosen={new Set(form.accountIds)}
                    onChange={(chosen) => {
                      change({ accountIds: [...chosen] });
                    }}
                  />
                </div>
              )}
            </Section>

            <Section
              title={say('common.usedFor')}
              detail={
                forKind.length === 0
                  ? isVideo
                    ? say('screens.adminArea.profileEditor.thereAreNoFilmOrSeriesLibraries')
                    : say('screens.adminArea.profileEditor.thereAreNoMusicLibraries')
                  : say('screens.adminArea.profileEditor.whichLibrariesOfferThisProfileWhen')
              }
            >
              {forKind.length === 0 ? null : (
                <AskerPicker
                  legend={say('common.libraries')}
                  everyLabel={say('common.everyLibrary2')}
                  askers={forKind.map((entry) => ({
                    id: entry.id,
                    name: entry.name,
                    detail:
                      entry.itemCount === 1
                        ? say('common.n1Item')
                        : sayCount('common.count.items', entry.itemCount),
                  }))}
                  chosen={new Set(form.libraryIds)}
                  onChange={(chosen) => {
                    change({ libraryIds: [...chosen] });
                  }}
                />
              )}
            </Section>
          </TabPanel>
        </DialogContent>

        <DialogFooter
          note={problem}
          dismiss={{ onChoose: onClose }}
          confirm={{
            label:
              profile === null
                ? say('screens.adminArea.profileEditor.addProfile')
                : say('common.save'),
            onChoose: save,
            isLoading: isSaving,
          }}
        />
      </Tabs>
    </Dialog>
  );
};

ProfileEditor.displayName = 'ProfileEditor';

export { ProfileEditor };
