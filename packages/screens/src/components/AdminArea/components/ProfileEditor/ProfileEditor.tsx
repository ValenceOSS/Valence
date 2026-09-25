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
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { ProfileEditorProps } from './ProfileEditor.types';

const TABS: readonly { id: ProfileTab; labelKey: StringKey }[] = [
  { id: 'quality', labelKey: 'admin.profileEditor.tabs.quality' },
  { id: 'matching', labelKey: 'admin.profileEditor.tabs.matching' },
  { id: 'access', labelKey: 'admin.profileEditor.tabs.access' },
];

/**
 * Whether a tab name is one of this dialog's.
 *
 * @param value - What the tabs said.
 * @returns Whether it names a tab.
 */
const isProfileTab = (value: string): value is ProfileTab => TABS.some((tab) => tab.id === value);

const KINDS: readonly { id: ProfileKind; labelKey: StringKey }[] = [
  { id: 'video', labelKey: 'admin.profileEditor.kinds.video' },
  { id: 'music', labelKey: 'admin.profileEditor.kinds.music' },
];

const LANGUAGES: readonly { id: string; label: string }[] = Object.entries(LANGUAGE_NAMES)
  .map(([id, label]) => ({ id, label }))
  .toSorted((left, right) => left.label.localeCompare(right.label));

const WAITS: readonly { id: ReleaseWait; labelKey: StringKey }[] = [
  { id: 'digital', labelKey: 'admin.profileEditor.waits.digital' },
  { id: 'physical', labelKey: 'admin.profileEditor.waits.physical' },
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
  anything = say('admin.profileEditor.bestThereIs'),
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
          setProblem(refusal?.message ?? say('admin.profileEditor.couldNotSave'));

          return;
        }

        notify.worked(
          profile === null
            ? say('admin.profileEditor.added', { name: value.name })
            : say('admin.profileEditor.saved', { name: value.name }),
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
      ? say('admin.profileEditor.addTitle')
      : say('admin.profileEditor.changeTitle', { name: profile.name });

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
          detail={say('admin.profileEditor.detail')}
          below={
            <TabRow
              label={say('admin.profileEditor.tabsLabel')}
              tone="underlined"
              size="sm"
              value={tab}
              groups={[{ items: TABS.map(({ id, labelKey }) => ({ id, label: say(labelKey) })) }]}
            />
          }
        />

        <DialogContent>
          <TabPanel value="quality" className="flex w-full flex-col gap-6">
            <Section title={say('admin.profileEditor.profile.title')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={say('admin.profileEditor.profile.name')}
                  value={form.name}
                  onValueChange={(name) => {
                    change({ name });
                  }}
                  placeholder={
                    isVideo
                      ? say('admin.profileEditor.profile.videoPlaceholder')
                      : say('admin.profileEditor.profile.musicPlaceholder')
                  }
                  required
                />

                <FormField label={say('admin.profileEditor.profile.for')}>
                  <SegmentedRow
                    label={say('admin.profileEditor.profile.for')}
                    size="sm"
                    items={KINDS.map(({ id, labelKey }) => ({ id, label: say(labelKey) }))}
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
              title={say('admin.profileEditor.takes.title')}
              detail={say('admin.profileEditor.takes.detail')}
            >
              {isVideo ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={say('admin.profileEditor.takes.resolutions')}>
                    <RankedChoices
                      label={say('admin.profileEditor.takes.resolutions')}
                      options={optionsOf(RESOLUTIONS)}
                      chosen={form.resolutions}
                      onChange={(resolutions) => {
                        change({ resolutions });
                      }}
                    />
                  </FormField>

                  <FormField
                    label={say('admin.profileEditor.takes.sources')}
                    description={say('admin.profileEditor.takes.sourcesDescription')}
                  >
                    <RankedChoices
                      label={say('admin.profileEditor.takes.sources')}
                      options={optionsOf(RELEASE_SOURCES)}
                      chosen={form.sources}
                      onChange={(sources) => {
                        change({ sources });
                      }}
                    />
                  </FormField>
                </div>
              ) : (
                <FormField label={say('admin.profileEditor.takes.formats')}>
                  <RankedChoices
                    label={say('admin.profileEditor.takes.formats')}
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
              title={say('admin.profileEditor.sizes.title')}
              detail={
                isVideo
                  ? say('admin.profileEditor.sizes.videoDetail')
                  : say('admin.profileEditor.sizes.musicDetail')
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
                    label={say('admin.profileEditor.sizes.smallest')}
                    type="number"
                    min={0}
                    value={form.smallestMb}
                    onValueChange={(smallestMb) => {
                      change({ smallestMb });
                    }}
                    placeholder={say('admin.profileEditor.sizes.noLimit')}
                  />

                  <TextField
                    label={say('admin.profileEditor.sizes.largest')}
                    type="number"
                    min={1}
                    value={form.largestMb}
                    onValueChange={(largestMb) => {
                      change({ largestMb });
                    }}
                    placeholder={say('admin.profileEditor.sizes.noLimit')}
                  />
                </div>
              )}
            </Section>
          </TabPanel>

          <TabPanel value="matching" className="flex w-full flex-col gap-6">
            {isVideo ? (
              <Section
                title={say('admin.profileEditor.films.title')}
                detail={say('admin.profileEditor.films.detail')}
              >
                <FormField label={say('admin.profileEditor.films.waitLabel')}>
                  <SegmentedRow
                    label={say('admin.profileEditor.films.waitLabel')}
                    size="sm"
                    items={WAITS.map(({ id, labelKey }) => ({ id, label: say(labelKey) }))}
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

            <Section title={say('admin.profileEditor.words.title')}>
              <TextField
                label={say('admin.profileEditor.words.preferred')}
                value={form.preferredWords}
                onValueChange={(preferredWords) => {
                  change({ preferredWords });
                }}
                description={say('admin.profileEditor.words.preferredDescription')}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={say('admin.profileEditor.words.required')}
                  value={form.requiredWords}
                  onValueChange={(requiredWords) => {
                    change({ requiredWords });
                  }}
                  description={say('admin.profileEditor.words.requiredDescription')}
                />

                <TextField
                  label={say('admin.profileEditor.words.banned')}
                  value={form.bannedWords}
                  onValueChange={(bannedWords) => {
                    change({ bannedWords });
                  }}
                  description={say('admin.profileEditor.words.bannedDescription')}
                />
              </div>
            </Section>

            <Section title={say('admin.profileEditor.upgrades.title')}>
              <Switch
                label={say('admin.profileEditor.upgrades.switch')}
                isOn={form.isUpgrading}
                onToggle={() => {
                  change({ isUpgrading: !form.isUpgrading });
                }}
              />

              {!form.isUpgrading ? null : isVideo ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Choosing
                    label={say('admin.profileEditor.upgrades.untilResolution')}
                    value={form.upgradeUntilResolution}
                    options={optionsOf(form.resolutions)}
                    onChoose={(upgradeUntilResolution) => {
                      change({ upgradeUntilResolution });
                    }}
                  />

                  <Choosing
                    label={say('admin.profileEditor.upgrades.andSource')}
                    value={form.upgradeUntilSource}
                    options={optionsOf(form.sources)}
                    onChoose={(upgradeUntilSource) => {
                      change({ upgradeUntilSource });
                    }}
                  />
                </div>
              ) : (
                <Choosing
                  label={say('admin.profileEditor.upgrades.untilFormat')}
                  value={form.upgradeUntilMusicQuality}
                  options={optionsOf(form.musicQualities)}
                  onChoose={(upgradeUntilMusicQuality) => {
                    change({ upgradeUntilMusicQuality });
                  }}
                />
              )}
            </Section>

            <Section
              title={say('admin.profileEditor.language.title')}
              detail={say('admin.profileEditor.language.detail')}
            >
              <Choosing
                label={say('admin.profileEditor.language.label')}
                value={form.preferredLanguage}
                options={LANGUAGES}
                onChoose={(preferredLanguage) => {
                  change({ preferredLanguage });
                }}
                anything={say('admin.profileEditor.language.libraryLanguage')}
              />
            </Section>
          </TabPanel>

          <TabPanel value="access" className="flex w-full flex-col gap-6">
            <Section
              title={say('admin.profileEditor.access.title')}
              detail={say('admin.profileEditor.access.detail')}
            >
              <Switch
                label={say('admin.profileEditor.access.always')}
                isOn={form.isDefault}
                onToggle={() => {
                  change({ isDefault: !form.isDefault });
                }}
              />

              <p className="font-body text-sm text-text-muted">
                {form.isDefault
                  ? isVideo
                    ? say('admin.profileEditor.access.alwaysVideo')
                    : say('admin.profileEditor.access.alwaysMusic')
                  : say('admin.profileEditor.access.leaveOff')}
              </p>

              {form.isDefault ? null : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <AskerPicker
                    legend={say('admin.profileEditor.access.roles')}
                    everyLabel={say('admin.profileEditor.access.anyRole')}
                    askers={(roles.data ?? []).map((role) => ({ id: role.id, name: role.name }))}
                    chosen={new Set(form.roleIds)}
                    onChange={(chosen) => {
                      change({ roleIds: [...chosen] });
                    }}
                  />

                  <AskerPicker
                    legend={say('admin.profileEditor.access.people')}
                    everyLabel={say('admin.profileEditor.access.anybody')}
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
              title={say('admin.profileEditor.usedFor.title')}
              detail={
                forKind.length === 0
                  ? isVideo
                    ? say('admin.profileEditor.usedFor.noVideoLibraries')
                    : say('admin.profileEditor.usedFor.noMusicLibraries')
                  : say('admin.profileEditor.usedFor.detail')
              }
            >
              {forKind.length === 0 ? null : (
                <AskerPicker
                  legend={say('admin.profileEditor.usedFor.libraries')}
                  everyLabel={say('admin.profileEditor.usedFor.everyLibrary')}
                  askers={forKind.map((entry) => ({
                    id: entry.id,
                    name: entry.name,
                    detail: sayCount('admin.profileEditor.usedFor.items', entry.itemCount),
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
            label: profile === null ? say('admin.profileEditor.addProfile') : say('common.save'),
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
