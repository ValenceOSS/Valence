import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
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
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { RankedChoices } from '@ValenceScreens/components/AdminArea/components/RankedChoices/RankedChoices';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import { formFor, readProfileForm } from './readProfileForm';
import type { ProfileKind } from '@ValenceContracts/schemas/QualityProfile';
import type { ProfileForm } from './readProfileForm';
import type { ProfileDialogProps } from './ProfileDialog.types';

const KINDS: readonly { id: ProfileKind; label: string }[] = [
  { id: 'video', label: 'Films and series' },
  { id: 'music', label: 'Music' },
];

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
 * Adds a quality profile, or changes one already kept: for films and series, which resolutions and
 * sources may be taken, best first, and how large a release may be an hour; for music, which
 * formats, and how large an album. Words can be preferred, required or banned, it can say whether
 * to upgrade later and up to what, and which libraries it is for.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param profile - The profile being changed, or null to add one.
 * @param onClose - Called when it is dismissed.
 * @param onSaved - Called with the profile as kept.
 */
const ProfileDialog = ({ isOpen, profile, onClose, onSaved }: ProfileDialogProps) => {
  const libraries = useQuery({ ...libraryQueries.all(), enabled: isOpen });
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
  const unit = isVideo ? 'MB an hour' : 'MB an album';
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

  const title = profile === null ? 'Add a profile' : `Change ${profile.name}`;

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Every release a search finds is judged against a profile: what it may not be is refused, and the rest are ranked by how well they fit."
      />

      <DialogContent className="flex flex-col gap-4">
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

        {isVideo ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Resolutions" description="Tick what may be taken, best first.">
              <RankedChoices
                label="Resolutions"
                options={optionsOf(RESOLUTIONS)}
                chosen={form.resolutions}
                onChange={(resolutions) => {
                  change({ resolutions });
                }}
              />
            </FormField>

            <FormField
              label="Sources"
              description="Tick what may be taken, best first. A release that does not say is let through."
            >
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
          <FormField label="Formats" description="Tick what may be taken, best first.">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={`Smallest (${unit})`}
            type="number"
            min={0}
            value={form.smallestMb}
            onValueChange={(smallestMb) => {
              change({ smallestMb });
            }}
            placeholder="No limit"
          />

          <TextField
            label={`Largest (${unit})`}
            type="number"
            min={1}
            value={form.largestMb}
            onValueChange={(largestMb) => {
              change({ largestMb });
            }}
            placeholder="No limit"
          />
        </div>

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

        <FormField
          label="Used for"
          description={
            forKind.length === 0
              ? `There are no ${isVideo ? 'film or series' : 'music'} libraries yet.`
              : 'The libraries whose requests are judged against this profile.'
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
        </FormField>
      </DialogContent>

      <DialogFooter>
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
      </DialogFooter>
    </DialogCompanion>
  );
};

ProfileDialog.displayName = 'ProfileDialog';

export { ProfileDialog };
