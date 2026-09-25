import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Icon } from '@ValenceUI/Icon';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { useHeldWhileClosing } from '@ValenceUI/Dialog.useHeldWhileClosing';
import { readLanguage, LANGUAGE_NAMES } from '@ValenceCore/functions/describeTrack';
import { updateLibrary } from '@ValenceClient/library/fetchLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibrarySettingsDialogProps } from './LibrarySettingsDialog.types';

const NONE_ID = 'none';

const SERVER_ID = 'server';

const THE_BEST = 'the-best';
type LanguageOption = { id: string; label: string; detail?: string };

const AT_ONCE_OPTIONS: readonly { id: string; labelKey: StringKey; detailKey?: StringKey }[] = [
  {
    id: SERVER_ID,
    labelKey: 'admin.librarySettingsDialog.atOnce.server',
    detailKey: 'admin.librarySettingsDialog.atOnce.serverDetail',
  },
  {
    id: '1',
    labelKey: 'admin.librarySettingsDialog.atOnce.single',
    detailKey: 'admin.librarySettingsDialog.atOnce.oneDetail',
  },
  { id: '2', labelKey: 'admin.librarySettingsDialog.atOnce.two' },
  { id: '4', labelKey: 'admin.librarySettingsDialog.atOnce.four' },
];

/**
 * The options for how many files are rendered at once, in words.
 */
const buildAtOnceOptions = (): LanguageOption[] =>
  AT_ONCE_OPTIONS.map((option) => ({
    id: option.id,
    label: say(option.labelKey),
    ...(option.detailKey === undefined ? {} : { detail: say(option.detailKey) }),
  }));

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
    { id: NONE_ID, label: say('admin.librarySettingsDialog.eachFileDefault') },
    ...ordered.map(([code, label]) => ({
      id: code,
      label,
      ...(code === browserLanguage
        ? { detail: say('admin.librarySettingsDialog.yourBrowser') }
        : {}),
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
  library: requested,
  isOpen,
  profiles = [],
  onClose,
  onUpdated,
  onRegenerate,
}: LibrarySettingsDialogProps) => {
  const library = useHeldWhileClosing(requested, isOpen);
  const languageOptions = buildLanguageOptions();
  const atOnceOptions = buildAtOnceOptions();

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
    tellOutcome(say('admin.librarySettingsDialog.saved', { name: updated.name }), null);
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
      const said =
        thrown instanceof Error
          ? thrown.message
          : say('admin.librarySettingsDialog.couldNotUpdate');

      setError(said);
      tellOutcome('', said);
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
  const atOnceLabel = atOnceOptions.find((option) => option.id === atOnce)?.label ?? atOnce;
  const profileLabel =
    requestProfileId === THE_BEST
      ? say('admin.librarySettingsDialog.whicheverProfile')
      : (profiles.find((profile) => profile.id === requestProfileId)?.name ??
        say('admin.librarySettingsDialog.whicheverProfile'));

  return (
    <DialogCompanion
      label={say('admin.librarySettingsDialog.label', { name: library.name })}
      isOpen={isOpen}
      onClose={close}
    >
      <DialogTitle size="compact" title={library.name} />

      {confirming === null ? (
        <>
          <DialogContent className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-text">
                {say('admin.librarySettingsDialog.audioLegend')}
              </legend>

              <p className="text-xs text-text-muted">
                {say('admin.librarySettingsDialog.audioBody')}
              </p>

              <OptionMenu
                label={say('admin.librarySettingsDialog.audioLegend')}
                groups={[
                  {
                    name: say('admin.librarySettingsDialog.languageGroup'),
                    selectedId: selected,
                    onSelect: setSelected,
                    options: languageOptions,
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">{selectedLabel}</span>
                    <Icon of={ChevronsUpDownIcon} size={15} tone="muted" className="shrink-0" />
                  </>
                }
                triggerShape="field"
                align="start"
                matchTriggerWidth
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-text">
                {say('admin.librarySettingsDialog.atOnceLegend')}
              </legend>

              <p className="text-xs text-text-muted">
                {say('admin.librarySettingsDialog.atOnceBody')}
              </p>

              <OptionMenu
                label={say('admin.librarySettingsDialog.atOnceLegend')}
                groups={[
                  {
                    name: say('admin.librarySettingsDialog.atOnceGroup'),
                    selectedId: atOnce,
                    onSelect: setAtOnce,
                    options: atOnceOptions,
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">{atOnceLabel}</span>
                    <Icon of={ChevronsUpDownIcon} size={15} tone="muted" className="shrink-0" />
                  </>
                }
                triggerShape="field"
                align="start"
                matchTriggerWidth
              />
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-text">
                {say('admin.librarySettingsDialog.requestsLegend')}
              </legend>

              <p className="text-xs text-text-muted">
                {say('admin.librarySettingsDialog.requestsBody')}
              </p>

              <Switch
                label={say('admin.librarySettingsDialog.takesRequests')}
                isOn={takesRequests}
                onToggle={() => {
                  setTakesRequests(!takesRequests);
                }}
              />

              {!takesRequests ? null : (
                <>
                  <OptionMenu
                    label={say('admin.librarySettingsDialog.profileLabel')}
                    groups={[
                      {
                        name: say('admin.librarySettingsDialog.qualityGroup'),
                        selectedId: requestProfileId,
                        onSelect: setRequestProfileId,
                        options: [
                          {
                            id: THE_BEST,
                            label: say('admin.librarySettingsDialog.whicheverProfile'),
                          },
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
                        <Icon of={ChevronsUpDownIcon} size={15} tone="muted" className="shrink-0" />
                      </>
                    }
                    triggerShape="field"
                    align="start"
                    matchTriggerWidth
                  />

                  <TextField
                    label={say('admin.librarySettingsDialog.requestPathLabel')}
                    value={requestPath}
                    onValueChange={setRequestPath}
                    placeholder={library.path}
                    description={say('admin.librarySettingsDialog.requestPathHelp')}
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
              label: say('common.save'),
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
              {say('admin.librarySettingsDialog.regenerateBody', {
                name: library.name,
                language: confirming.label,
              })}
            </p>
          </DialogContent>

          <DialogFooter
            dismiss={{
              label: say('admin.librarySettingsDialog.notNow'),
              onChoose: () => {
                finish(confirming.saved);
              },
            }}
            confirm={{ label: say('admin.librarySettingsDialog.regenerate'), onChoose: regenerate }}
          />
        </>
      )}
    </DialogCompanion>
  );
};

LibrarySettingsDialog.displayName = 'LibrarySettingsDialog';

export { LibrarySettingsDialog };
