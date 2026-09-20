import { Icon } from '@ValenceUI/Icon';
import { UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { readLanguage, LANGUAGE_NAMES } from '@ValenceCore/functions/describeTrack';
import { updateLibrary } from '@ValenceClient/library/fetchLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibrarySettingsDialogProps } from './LibrarySettingsDialog.types';

const NONE_ID = 'none';

const SERVER_ID = 'server';

const THE_BEST = 'the-best';
type LanguageOption = { id: string; label: string; detail?: string };

const AT_ONCE_OPTIONS = [
  { id: SERVER_ID, label: 'However many the server allows', detail: 'Right for a local disk' },
  { id: '1', label: 'One at a time', detail: 'Right for a network share' },
  { id: '2', label: 'Two at a time' },
  { id: '4', label: 'Four at a time' },
];

/**
 * The language picker's options, with the browser's own language pinned to the top when it is one
 * Valence recognises.
 */
const buildLanguageOptions = (): LanguageOption[] => {
  const primarySubtag =
    typeof navigator === 'undefined' ? null : (navigator.language.split('-')[0] ?? null);
  const browserLanguage = readLanguage(primarySubtag);
  const entries = Object.entries(LANGUAGE_NAMES).sort((a, b) => a[1].localeCompare(b[1]));
  const browserEntry = entries.find(([code]) => code === browserLanguage);
  const rest = entries.filter(([code]) => code !== browserLanguage);
  const ordered = browserEntry === undefined ? rest : [browserEntry, ...rest];

  return [
    { id: NONE_ID, label: "Each file's own default" },
    ...ordered.map(([code, label]) => ({
      id: code,
      label,
      ...(code === browserLanguage ? { detail: 'Your browser' } : {}),
    })),
  ];
};

/**
 * A library's own settings: what it is called, where it reads from, how many files it converts at
 * once, and which language its previews are made in. Changing the preview language offers to remake
 * the previews already there, since the setting alone would leave the library in two languages.
 *
 * @param library - The library being changed, or null when the dialog is closed.
 * @param isOpen - Whether the dialog is showing.
 * @param profiles - The quality profiles one of them may be judged by, where requesting is on.
 * @param onClose - Called when it is dismissed.
 * @param onUpdated - Called with the library once its settings have been written.
 * @param onRegenerate - Called with the library whose previews are to be remade.
 */
const LibrarySettingsDialog = ({
  library,
  isOpen,
  profiles = [],
  onClose,
  onUpdated,
  onRegenerate,
}: LibrarySettingsDialogProps) => {
  const languageOptions = buildLanguageOptions();

  const [selected, setSelected] = useState(library?.defaultAudioLanguage ?? NONE_ID);
  const [atOnce, setAtOnce] = useState(library?.filesAtOnce?.toString() ?? SERVER_ID);
  const [takesRequests, setTakesRequests] = useState(library?.takesRequests ?? true);
  const [requestProfileId, setRequestProfileId] = useState(library?.requestProfileId ?? THE_BEST);
  const [requestPath, setRequestPath] = useState(library?.requestPath ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ saved: Library; label: string } | null>(null);

  const reset = () => {
    setSelected(library?.defaultAudioLanguage ?? NONE_ID);
    setAtOnce(library?.filesAtOnce?.toString() ?? SERVER_ID);
    setTakesRequests(library?.takesRequests ?? true);
    setRequestProfileId(library?.requestProfileId ?? THE_BEST);
    setRequestPath(library?.requestPath ?? '');
    setError(null);
    setConfirming(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const finish = (updated: Library) => {
    onUpdated(updated);
    reset();
    onClose();
  };

  const save = async () => {
    if (library === null) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const defaultAudioLanguage = selected === NONE_ID ? null : selected;
      const changed = defaultAudioLanguage !== (library.defaultAudioLanguage ?? null);
      const updated = await updateLibrary(library.id, {
        defaultAudioLanguage,
        filesAtOnce: atOnce === SERVER_ID ? null : Number.parseInt(atOnce, 10),
        takesRequests,
        requestProfileId: requestProfileId === THE_BEST ? null : requestProfileId,
        requestPath: requestPath.trim() === '' ? null : requestPath.trim(),
      });

      if (changed && library.itemCount > 0) {
        const label = languageOptions.find((option) => option.id === selected)?.label ?? selected;

        setConfirming({ saved: updated, label });
      } else {
        finish(updated);
      }
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'The library could not be updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const regenerate = () => {
    if (confirming === null) {
      return;
    }

    onRegenerate(confirming.saved.id);
    finish(confirming.saved);
  };

  if (library === null) {
    return null;
  }

  const selectedLabel = languageOptions.find((option) => option.id === selected)?.label ?? selected;
  const atOnceLabel = AT_ONCE_OPTIONS.find((option) => option.id === atOnce)?.label ?? atOnce;
  const profileLabel =
    requestProfileId === THE_BEST
      ? 'Whichever profile names this library'
      : (profiles.find((profile) => profile.id === requestProfileId)?.name ??
        'Whichever profile names this library');

  return (
    <DialogCompanion label={`${library.name} settings`} isOpen={isOpen} onClose={close}>
      <DialogTitle size="compact" title={library.name} />

      {confirming === null ? (
        <>
          <DialogContent className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-text">Force default audio track</legend>

              <p className="text-xs text-text-muted">
                Previews and playback prefer this language, when a file has a track in it. A file
                with no matching track keeps its own default.
              </p>

              <OptionMenu
                label="Force default audio track"
                groups={[
                  {
                    name: 'Language',
                    selectedId: selected,
                    onSelect: setSelected,
                    options: languageOptions,
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">{selectedLabel}</span>
                    <Icon of={UnfoldMoreIcon} size={15} className="shrink-0 text-text-muted" />
                  </>
                }
                triggerShape="field"
                align="start"
                matchTriggerWidth
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-text">Files at once</legend>

              <p className="text-xs text-text-muted">
                How many of this library&rsquo;s files are rendered at the same time. A library on a
                local disk wants as many as the machine can feed. A library on a network share wants
                one: the files come down a single wire, and asking for four divides it four ways.
              </p>

              <OptionMenu
                label="Files at once"
                groups={[
                  {
                    name: 'At once',
                    selectedId: atOnce,
                    onSelect: setAtOnce,
                    options: AT_ONCE_OPTIONS,
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">{atOnceLabel}</span>
                    <Icon of={UnfoldMoreIcon} size={15} className="shrink-0 text-text-muted" />
                  </>
                }
                triggerShape="field"
                align="start"
                matchTriggerWidth
              />
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-text">Requests</legend>

              <p className="text-xs text-text-muted">
                Whether what people ask for can be filed here, which profile those releases are
                judged by, and where they are put. Left alone, they are judged by whichever profile
                names this library and filed in the library&rsquo;s own folder.
              </p>

              <Switch
                label="Takes requests"
                isOn={takesRequests}
                onToggle={() => {
                  setTakesRequests(!takesRequests);
                }}
              />

              {!takesRequests ? null : (
                <>
                  <OptionMenu
                    label="Quality profile for requests"
                    groups={[
                      {
                        name: 'Quality',
                        selectedId: requestProfileId,
                        onSelect: setRequestProfileId,
                        options: [
                          { id: THE_BEST, label: 'Whichever profile names this library' },
                          ...profiles
                            .filter(
                              (profile) =>
                                profile.kind === (library.kind === 'music' ? 'music' : 'video'),
                            )
                            .map((profile) => ({ id: profile.id, label: profile.name })),
                        ],
                      },
                    ]}
                    trigger={
                      <>
                        <span className="truncate">{profileLabel}</span>
                        <Icon of={UnfoldMoreIcon} size={15} className="shrink-0 text-text-muted" />
                      </>
                    }
                    triggerShape="field"
                    align="start"
                    matchTriggerWidth
                  />

                  <TextField
                    label="Where requests are filed"
                    value={requestPath}
                    onValueChange={setRequestPath}
                    placeholder={library.path}
                    description="A folder of its own for what is fetched, where you want it kept apart. The library’s own folder otherwise."
                  />
                </>
              )}
            </fieldset>

            {error === null ? null : (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </DialogContent>

          <DialogFooter
            dismiss={{ onChoose: close, isDisabled: isSaving }}
            confirm={{
              label: 'Save',
              onChoose: () => {
                void save();
              },
              isLoading: isSaving,
            }}
          />
        </>
      ) : (
        <>
          <DialogContent>
            <p className="text-sm text-text-muted">
              This will start a preview generation task for {library.name}&rsquo;s existing media,
              so previews match {confirming.label}. Progress shows next to the library once started.
              Continue?
            </p>
          </DialogContent>

          <DialogFooter
            dismiss={{
              label: 'Not now',
              onChoose: () => {
                finish(confirming.saved);
              },
            }}
            confirm={{ label: 'Regenerate previews', onChoose: regenerate }}
          />
        </>
      )}
    </DialogCompanion>
  );
};

LibrarySettingsDialog.displayName = 'LibrarySettingsDialog';

export { LibrarySettingsDialog };
