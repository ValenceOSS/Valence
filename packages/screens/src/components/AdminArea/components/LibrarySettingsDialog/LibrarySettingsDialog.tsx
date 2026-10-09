import type { HigherProfileAsks } from '@ValenceContracts/schemas/HigherProfileAsks';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Icon } from '@ValenceUI/Icon';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react/fill';
import { useId, useState } from 'react';
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
import { arrKindOf } from '@ValenceContracts/functions/arrKindOf';
import type { Library } from '@ValenceContracts/schemas/Library';
import { FulfilmentFields } from './components/FulfilmentFields/FulfilmentFields';
import { VALENCE, fulfilmentFormOf, readFulfilmentForm } from './readFulfilmentForm';
import type { FulfilmentForm } from './readFulfilmentForm';
import type { LibrarySettingsDialogProps } from './LibrarySettingsDialog.types';
import { LeftOutList } from './components/LeftOutList/LeftOutList';
import { say } from '@ValenceI18n/say';

const HIGHER_PROFILE_ASK_CHOICES: readonly { id: HigherProfileAsks; label: string }[] = [
  { id: 'ask', label: say('screens.adminArea.librarySettingsDialog.askMe') },
  { id: 'upgrade', label: say('screens.adminArea.librarySettingsDialog.switchToTheHigherProfile') },
  { id: 'keep', label: say('screens.adminArea.librarySettingsDialog.keepTheProfileAskedFirst') },
  { id: 'both', label: say('screens.adminArea.librarySettingsDialog.keepBothVersions') },
];

const NONE_ID = 'none';

const SERVER_ID = 'server';

const THE_BEST = 'the-best';
type LanguageOption = { id: string; label: string; detail?: string };

const AT_ONCE_OPTIONS = [
  {
    id: SERVER_ID,
    label: say('screens.adminArea.librarySettingsDialog.howeverManyTheServerAllows'),
    detail: say('screens.adminArea.librarySettingsDialog.rightForALocalDisk'),
  },
  {
    id: '1',
    label: say('screens.adminArea.librarySettingsDialog.oneAtATime'),
    detail: say('screens.adminArea.librarySettingsDialog.rightForANetworkShare'),
  },
  { id: '2', label: say('screens.adminArea.librarySettingsDialog.twoAtATime') },
  { id: '4', label: say('screens.adminArea.librarySettingsDialog.fourAtATime') },
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
    { id: NONE_ID, label: say('screens.adminArea.librarySettingsDialog.eachFilesOwnDefault') },
    ...ordered.map(([code, label]) => ({
      id: code,
      label,
      ...(code === browserLanguage
        ? { detail: say('screens.adminArea.librarySettingsDialog.yourBrowser') }
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
 * @param arrApps - The connected apps its requests may be handed to, where requesting is on.
 * @param onClose - Called when it is dismissed.
 * @param onUpdated - Called with the library once its settings have been written.
 * @param onRegenerate - Called with the library whose previews are to be remade.
 */
const LibrarySettingsDialog = ({
  library: requested,
  isOpen,
  profiles = [],
  arrApps = [],
  onClose,
  onUpdated,
  onRegenerate,
}: LibrarySettingsDialogProps) => {
  const library = useHeldWhileClosing(requested, isOpen);
  const keepsTogetherId = useId();
  const languageOptions = buildLanguageOptions();

  const [selected, setSelected] = useState(library?.defaultAudioLanguage ?? NONE_ID);
  const [atOnce, setAtOnce] = useState(library?.filesAtOnce?.toString() ?? SERVER_ID);
  const [takesRequests, setTakesRequests] = useState(library?.takesRequests ?? true);
  const [requestProfileId, setRequestProfileId] = useState(library?.requestProfileId ?? THE_BEST);
  const [requestPath, setRequestPath] = useState(library?.requestPath ?? '');
  const [keepsShowsTogether, setKeepsShowsTogether] = useState(library?.keepsShowsTogether ?? true);
  const [higherProfileAsks, setHigherProfileAsks] = useState<HigherProfileAsks>(
    library?.higherProfileAsks ?? 'ask',
  );
  const [fulfilment, setFulfilment] = useState<FulfilmentForm>(() => fulfilmentFormOf(library));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ saved: Library; label: string } | null>(null);

  const reset = () => {
    setSelected(library?.defaultAudioLanguage ?? NONE_ID);
    setAtOnce(library?.filesAtOnce?.toString() ?? SERVER_ID);
    setTakesRequests(library?.takesRequests ?? true);
    setRequestProfileId(library?.requestProfileId ?? THE_BEST);
    setRequestPath(library?.requestPath ?? '');
    setKeepsShowsTogether(library?.keepsShowsTogether ?? true);
    setHigherProfileAsks(library?.higherProfileAsks ?? 'ask');
    setFulfilment(fulfilmentFormOf(library));
    setError(null);
    setConfirming(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const finish = (updated: Library) => {
    tellOutcome(
      say('screens.adminArea.librarySettingsDialog.savedTheSettingsOfName', { name: updated.name }),
      null,
    );
    onUpdated(updated);
    reset();
    onClose();
  };

  const save = async () => {
    if (library === null) {
      return;
    }

    const handedTo = readFulfilmentForm(fulfilment, arrKindOf(library.kind));

    if (handedTo.problem !== null) {
      setError(handedTo.problem);

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
        keepsShowsTogether,
        higherProfileAsks,
        fulfilment: handedTo.fulfilment,
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
          : say('screens.adminArea.librarySettingsDialog.theLibraryCouldNotBeUpdated');

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

  const arrKind = arrKindOf(library.kind);
  const canHandOff = arrApps.some((app) => app.kind === arrKind);
  const isHandedOff = arrKind !== null && fulfilment.appId !== VALENCE;
  const selectedLabel = languageOptions.find((option) => option.id === selected)?.label ?? selected;
  const atOnceLabel = AT_ONCE_OPTIONS.find((option) => option.id === atOnce)?.label ?? atOnce;
  const profileLabel =
    requestProfileId === THE_BEST
      ? say('screens.adminArea.librarySettingsDialog.whicheverProfileNamesThisLibrary')
      : (profiles.find((profile) => profile.id === requestProfileId)?.name ??
        say('screens.adminArea.librarySettingsDialog.whicheverProfileNamesThisLibrary'));

  return (
    <DialogCompanion
      label={say('common.nameSettings', { name: library.name })}
      isOpen={isOpen}
      onClose={close}
    >
      <DialogTitle size="compact" title={library.name} />

      {confirming === null ? (
        <>
          <DialogContent className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-text">
                {say('screens.adminArea.librarySettingsDialog.forceDefaultAudioTrack')}
              </legend>

              <p className="text-xs text-text-muted">
                {say(
                  'screens.adminArea.librarySettingsDialog.previewsAndPlaybackPreferThisLanguage',
                )}
              </p>

              <OptionMenu
                label={say('screens.adminArea.librarySettingsDialog.forceDefaultAudioTrack')}
                groups={[
                  {
                    name: say('common.language'),
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
                {say('screens.adminArea.librarySettingsDialog.filesAtOnce')}
              </legend>

              <p className="text-xs text-text-muted">
                {say('screens.adminArea.librarySettingsDialog.howManyOfThisLibrarysFiles')}
              </p>

              <OptionMenu
                label={say('screens.adminArea.librarySettingsDialog.filesAtOnce')}
                groups={[
                  {
                    name: say('screens.adminArea.librarySettingsDialog.atOnce'),
                    selectedId: atOnce,
                    onSelect: setAtOnce,
                    options: AT_ONCE_OPTIONS,
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
              <legend className="text-sm font-medium text-text">{say('common.requests')}</legend>

              <p className="text-xs text-text-muted">
                {say('screens.adminArea.librarySettingsDialog.whetherWhatPeopleAskForCan')}
              </p>

              <Switch
                label={say('screens.adminArea.librarySettingsDialog.takesRequests')}
                isOn={takesRequests}
                onToggle={() => {
                  setTakesRequests(!takesRequests);
                }}
              />

              {!takesRequests || arrKind === null || (!canHandOff && !isHandedOff) ? null : (
                <FulfilmentFields
                  kind={arrKind}
                  apps={arrApps}
                  form={fulfilment}
                  onChange={(next) => {
                    setFulfilment((current) => ({ ...current, ...next }));
                    setError(null);
                  }}
                />
              )}

              {!takesRequests || isHandedOff ? null : (
                <>
                  <OptionMenu
                    label={say('screens.adminArea.librarySettingsDialog.qualityProfileForRequests')}
                    groups={[
                      {
                        name: say('common.quality'),
                        selectedId: requestProfileId,
                        onSelect: setRequestProfileId,
                        options: [
                          {
                            id: THE_BEST,
                            label: say(
                              'screens.adminArea.librarySettingsDialog.whicheverProfileNamesThisLibrary',
                            ),
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
                    label={say('screens.adminArea.librarySettingsDialog.whereRequestsAreFiled')}
                    value={requestPath}
                    onValueChange={setRequestPath}
                    placeholder={library.path}
                    description={say('screens.adminArea.librarySettingsDialog.aFolderOfItsOwnFor')}
                  />

                  <div className="flex flex-col gap-1">
                    <OptionMenu
                      label={say('screens.adminArea.librarySettingsDialog.higherQualityRequests')}
                      groups={[
                        {
                          name: say(
                            'screens.adminArea.librarySettingsDialog.higherQualityRequests',
                          ),
                          selectedId: higherProfileAsks,
                          onSelect: (next) => {
                            const chosen = HIGHER_PROFILE_ASK_CHOICES.find(
                              (choice) => choice.id === next,
                            );

                            if (chosen !== undefined) {
                              setHigherProfileAsks(chosen.id);
                            }
                          },
                          options: HIGHER_PROFILE_ASK_CHOICES.filter(
                            (choice) => choice.id !== 'both' || library.kind === 'movies',
                          ).map(({ id, label }) => ({ id, label })),
                        },
                      ]}
                      trigger={
                        <>
                          <span className="truncate">
                            {HIGHER_PROFILE_ASK_CHOICES.find(
                              (choice) => choice.id === higherProfileAsks,
                            )?.label ?? ''}
                          </span>
                          <Icon
                            of={ChevronsUpDownIcon}
                            size={15}
                            tone="muted"
                            className="shrink-0"
                          />
                        </>
                      }
                      triggerShape="field"
                      align="start"
                      matchTriggerWidth
                    />
                    <p className="text-xs text-text-muted">
                      {say('screens.adminArea.librarySettingsDialog.whenSomebodyAsksForATitle')}
                    </p>
                  </div>

                  {library.kind === 'shows' ? (
                    <div className="flex flex-col gap-1">
                      <Switch
                        label={say(
                          'screens.adminArea.librarySettingsDialog.keepNewEpisodesWithTheShow',
                        )}
                        isOn={keepsShowsTogether}
                        onToggle={() => {
                          setKeepsShowsTogether(!keepsShowsTogether);
                        }}
                        describedBy={keepsTogetherId}
                      />
                      <p id={keepsTogetherId} className="text-xs text-text-muted">
                        {say('screens.adminArea.librarySettingsDialog.putsNewSeasonsOfAShow')}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </fieldset>

            <LeftOutList libraryId={library.id} libraryPath={library.path} />

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
              {say('screens.adminArea.librarySettingsDialog.thisWillStartAPreviewGeneration', {
                name: library.name,
                label: confirming.label,
              })}
            </p>
          </DialogContent>

          <DialogFooter
            dismiss={{
              label: say('common.notNow'),
              onChoose: () => {
                finish(confirming.saved);
              },
            }}
            confirm={{
              label: say('screens.adminArea.librarySettingsDialog.regeneratePreviews'),
              onChoose: regenerate,
            }}
          />
        </>
      )}
    </DialogCompanion>
  );
};

LibrarySettingsDialog.displayName = 'LibrarySettingsDialog';

export { LibrarySettingsDialog };
