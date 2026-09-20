import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import {
  MUSIC_QUALITIES,
  RELEASE_SOURCES,
  RESOLUTIONS,
} from '@ValenceContracts/schemas/ParsedRelease';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { addProfile, changeProfile } from '@ValenceClient/requests/fetchProfiles';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { QualitySizes } from '@ValenceScreens/components/AdminArea/components/ProfileEditor/components/QualitySizes/QualitySizes';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { RankedChoices } from '@ValenceScreens/components/AdminArea/components/RankedChoices/RankedChoices';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import { formFor, readProfileForm } from './readProfileForm';
import type { ProfileKind, ReleaseWait } from '@ValenceContracts/schemas/QualityProfile';
import type { ProfileForm } from './readProfileForm';
import type { ProfileEditorProps } from './ProfileEditor.types';

const KINDS: readonly { id: ProfileKind; label: string }[] = [
  { id: 'video', label: 'Films and series' },
  { id: 'music', label: 'Music' },
];

const WAITS: readonly { id: ReleaseWait; label: string }[] = [
  { id: 'digital', label: 'Out digitally' },
  { id: 'physical', label: 'Out on disc' },
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
}: {
  label: string;
  value: Value | null;
  options: readonly { id: Value; label: string }[];
  onChoose: (value: Value | null) => void;
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
          options: [{ id: 'any', label: 'The best there is' }, ...options],
        },
      ]}
      trigger={
        <>
          <span className="truncate">
            {options.find((option) => option.id === value)?.label ?? 'The best there is'}
          </span>
          <Icon of={UnfoldMoreIcon} size={15} className="shrink-0" />
        </>
      }
    />
  </FormField>
);

Choosing.displayName = 'Choosing';

/**
 * The page for adding a quality profile, or changing one already kept: for films and series, which
 * resolutions and sources may be taken, best first, how large a release of each quality may be an
 * hour, and whether a film is held until it is out digitally or on disc; for music, which formats,
 * and how large an album. Words can be preferred, required or banned, it can say whether to
 * upgrade later and up to what, and which libraries it is for.
 *
 * @param profile - The profile being changed, or null to add one.
 * @param onClose - Called to go back to every profile.
 * @param onSaved - Called with the profile as kept.
 */
const ProfileEditor = ({ profile, onClose, onSaved }: ProfileEditorProps) => {
  const libraries = useQuery(libraryQueries.all());
  const [form, setForm] = useState<ProfileForm>(() => formFor(profile));
  const [shownFor, setShownFor] = useState(profile);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

      return;
    }

    setIsSaving(true);

    void (profile === null ? addProfile(outcome.draft) : changeProfile(profile.id, outcome.draft))
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? 'That could not be saved.');

          return;
        }

        onSaved(value);
        onClose();
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const title = profile === null ? 'Add media profile' : `Change ${profile.name}`;

  return (
    <PanelCard
      title={title}
      actions={
        <Button variant="ghost" size="xs" onClick={onClose}>
          <Icon of={ArrowLeft01Icon} size={14} />
          Every profile
        </Button>
      }
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <p className="font-body text-sm text-text-muted">
          Every release a search finds is judged against a profile: what it may not be is refused,
          and the rest are ranked by how well they fit.
        </p>

        <Section title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              value={form.name}
              onValueChange={(name) => {
                change({ name });
              }}
              placeholder={isVideo ? 'HD' : 'Lossless'}
              required
            />

            <FormField label="For">
              <SegmentedRow
                label="For"
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
          title="What it takes"
          detail="Tick what may be taken, best first. The order is what ranks releases before anything else."
        >
          {isVideo ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Resolutions">
                <RankedChoices
                  label="Resolutions"
                  options={optionsOf(RESOLUTIONS)}
                  chosen={form.resolutions}
                  onChange={(resolutions) => {
                    change({ resolutions });
                  }}
                />
              </FormField>

              <FormField label="Sources" description="A release that does not say is let through.">
                <RankedChoices
                  label="Sources"
                  options={optionsOf(RELEASE_SOURCES)}
                  chosen={form.sources}
                  onChange={(sources) => {
                    change({ sources });
                  }}
                />
              </FormField>
            </div>
          ) : (
            <FormField label="Formats">
              <RankedChoices
                label="Formats"
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
          title="Sizes"
          detail={
            isVideo
              ? 'How large a release of each quality may be, an hour of it, so a whole season is judged by its episodes. A handle at either end is no limit.'
              : 'How large an album may be.'
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
                label="Smallest (MB an album)"
                type="number"
                min={0}
                value={form.smallestMb}
                onValueChange={(smallestMb) => {
                  change({ smallestMb });
                }}
                placeholder="No limit"
              />

              <TextField
                label="Largest (MB an album)"
                type="number"
                min={1}
                value={form.largestMb}
                onValueChange={(largestMb) => {
                  change({ largestMb });
                }}
                placeholder="No limit"
              />
            </div>
          )}
        </Section>

        {isVideo ? (
          <Section
            title="Films"
            detail="A film is held until then before it is searched for, so nothing is fetched from cinemas."
          >
            <FormField label="Search films once they are">
              <SegmentedRow
                label="Search films once they are"
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

        <Section title="Words">
          <TextField
            label="Preferred words"
            value={form.preferredWords}
            onValueChange={(preferredWords) => {
              change({ preferredWords });
            }}
            description="Each one a release has adds to its score. Separate them with commas; a word between slashes, such as /hdr10\+?/, is a pattern."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Required words"
              value={form.requiredWords}
              onValueChange={(requiredWords) => {
                change({ requiredWords });
              }}
              description="A release needs at least one."
            />

            <TextField
              label="Banned words"
              value={form.bannedWords}
              onValueChange={(bannedWords) => {
                change({ bannedWords });
              }}
              description="A release with any is refused."
            />
          </div>
        </Section>

        <Section title="Upgrades">
          <Switch
            label="Upgrade to a better release later"
            isOn={form.isUpgrading}
            onToggle={() => {
              change({ isUpgrading: !form.isUpgrading });
            }}
          />

          {!form.isUpgrading ? null : isVideo ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Choosing
                label="Until the resolution is"
                value={form.upgradeUntilResolution}
                options={optionsOf(form.resolutions)}
                onChoose={(upgradeUntilResolution) => {
                  change({ upgradeUntilResolution });
                }}
              />

              <Choosing
                label="And the source is"
                value={form.upgradeUntilSource}
                options={optionsOf(form.sources)}
                onChoose={(upgradeUntilSource) => {
                  change({ upgradeUntilSource });
                }}
              />
            </div>
          ) : (
            <Choosing
              label="Until the format is"
              value={form.upgradeUntilMusicQuality}
              options={optionsOf(form.musicQualities)}
              onChoose={(upgradeUntilMusicQuality) => {
                change({ upgradeUntilMusicQuality });
              }}
            />
          )}
        </Section>

        <Section
          title="Used for"
          detail={
            forKind.length === 0
              ? `There are no ${isVideo ? 'film or series' : 'music'} libraries yet.`
              : 'The libraries whose requests are judged against this profile, unless a request names another.'
          }
        >
          {forKind.length === 0 ? null : (
            <LibraryPicker
              libraries={forKind}
              chosen={new Set(form.libraryIds)}
              onChange={(chosen) => {
                change({ libraryIds: [...chosen] });
              }}
            />
          )}
        </Section>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
          {problem === null ? null : (
            <span role="alert" className="mr-auto text-sm text-danger">
              {problem}
            </span>
          )}

          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="glossy" isLoading={isSaving} onClick={save}>
            {profile === null ? 'Add profile' : 'Save'}
          </Button>
        </footer>
      </div>
    </PanelCard>
  );
};

ProfileEditor.displayName = 'ProfileEditor';

export { ProfileEditor };
