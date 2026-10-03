import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { FormField } from '@ValenceUI/FormField';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { Icon } from '@ValenceUI/Icon';
import { Folder as FolderIcon } from '@keyline-icons/react/fill';
import { FolderBrowser } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/FolderBrowser';
import { SELECTABLE_LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { LIBRARY_KIND_NAMES } from '@ValenceClient/library/LIBRARY_KIND_NAMES';
import { LIBRARY_PRESETS } from './LIBRARY_PRESETS';
import { createLibrary } from '@ValenceClient/library/fetchLibrary';
import { AddLibraryFormSchema } from './AddLibraryFormSchema';
import { CUSTOM_PRESET } from './CUSTOM_PRESET';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import type { z } from 'zod';
import type { AddLibraryDialogProps } from './AddLibraryDialog.types';
import { say } from '@ValenceI18n/say';

const INITIAL: z.input<typeof AddLibraryFormSchema> = {
  name: '',
  preset: 'movies',
  customKind: 'shows',
  flavour: '',
  path: '',
};

/**
 * Adds a library: what to call it, and the folder on the machine running Valence that holds it. Does not
 * scan it — adding is quick and scanning is not, so the two are separate gestures.
 *
 * The folder can be typed or found: browsing walks the server's own folders, since a path typed from
 * memory on a machine somebody is not sitting at is the easiest thing here to get wrong.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 * @param onCreated - Called with the library once the server has made it.
 */
const AddLibraryDialog = ({ isOpen, onClose, onCreated }: AddLibraryDialogProps) => {
  const [isBrowsing, setIsBrowsing] = useState(false);

  const form = useZodForm(AddLibraryFormSchema, INITIAL, async (answers, { reset }) => {
    const isCustom = answers.preset === CUSTOM_PRESET;
    const chosen = LIBRARY_PRESETS.find((entry) => entry.id === answers.preset);

    try {
      const library = await createLibrary(
        isCustom
          ? {
              name: answers.name,
              kind: answers.customKind,
              flavour: answers.flavour,
              path: answers.path,
            }
          : {
              name: answers.name,
              kind: chosen?.kind ?? 'movies',
              ...(chosen?.flavour === null || chosen === undefined
                ? {}
                : { flavour: chosen.flavour }),
              path: answers.path,
            },
      );

      onCreated(library);
      tellOutcome(say('common.addedName', { name: library.name }), null);
      reset(INITIAL);
      setIsBrowsing(false);

      return null;
    } catch (error) {
      const said =
        error instanceof Error
          ? error.message
          : say('screens.adminArea.addLibraryDialog.theLibraryCouldNotBeAdded');

      tellOutcome('', said);

      return said;
    }
  });

  const close = () => {
    form.reset(INITIAL);
    setIsBrowsing(false);
    onClose();
  };

  return (
    <DialogCompanion label={say('common.addALibrary')} isOpen={isOpen} onClose={close}>
      <DialogTitle size="compact" title={say('common.addALibrary')} />

      <Form label={say('common.addALibrary')} onSubmit={form.submit} isDialog>
        <DialogContent className="flex flex-col gap-5">
          <TextField label={say('common.name')} {...form.text('name')} />

          <FormField
            label={say('screens.adminArea.addLibraryDialog.type')}
            description={say('screens.adminArea.addLibraryDialog.whatThisLibraryHoldsWhichDecides')}
          >
            <div className="flex flex-wrap gap-2">
              {[
                ...LIBRARY_PRESETS,
                { id: CUSTOM_PRESET, label: say('screens.adminArea.addLibraryDialog.custom') },
              ].map((entry) => (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={entry.id === form.values.preset ? 'primary' : 'secondary'}
                  aria-pressed={entry.id === form.values.preset}
                  onClick={() => {
                    form.set('preset', entry.id);
                  }}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </FormField>

          {form.values.preset === CUSTOM_PRESET ? (
            <>
              <TextField
                label={say('screens.adminArea.addLibraryDialog.typeName')}
                {...form.text('flavour')}
                placeholder={say('screens.adminArea.addLibraryDialog.documentaries')}
                description={say('screens.adminArea.addLibraryDialog.whatToCallThisKindOf')}
              />

              <FormField
                label={say('screens.adminArea.addLibraryDialog.readsLike')}
                description={say('screens.adminArea.addLibraryDialog.whichOfTheBuiltInKinds')}
              >
                <div className="flex flex-wrap gap-2">
                  {SELECTABLE_LIBRARY_KINDS.map((entry) => (
                    <Button
                      key={entry}
                      size="sm"
                      variant={entry === form.values.customKind ? 'primary' : 'secondary'}
                      aria-pressed={entry === form.values.customKind}
                      onClick={() => {
                        form.set('customKind', entry);
                      }}
                    >
                      {say('screens.adminArea.addLibraryDialog.readsLikeKINDLABELS', {
                        KIND_LABELS: LIBRARY_KIND_NAMES[entry].toLowerCase(),
                      })}
                    </Button>
                  ))}
                </div>
              </FormField>
            </>
          ) : null}

          <div className="flex flex-col gap-3">
            <TextField
              label={say('screens.adminArea.addLibraryDialog.path')}
              {...form.text('path')}
              placeholder="/media/movies"
              description={say('screens.adminArea.addLibraryDialog.aFolderOnTheMachineRunning')}
              {...(isBrowsing
                ? {}
                : {
                    trailing: (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsBrowsing(true);
                        }}
                      >
                        <Icon of={FolderIcon} size={14} />
                        {say('screens.adminArea.addLibraryDialog.browse')}
                      </Button>
                    ),
                  })}
            />

            {isBrowsing ? (
              <FolderBrowser
                start={form.values.path}
                onChoose={(chosen) => {
                  form.set('path', chosen);
                  setIsBrowsing(false);
                }}
                onCancel={() => {
                  setIsBrowsing(false);
                }}
              />
            ) : null}
          </div>
        </DialogContent>

        <DialogFooter
          note={form.problem}
          dismiss={{ onChoose: close, isDisabled: form.isSubmitting }}
          confirm={{
            label: say('common.addLibrary'),
            isSubmit: true,
            isLoading: form.isSubmitting,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

AddLibraryDialog.displayName = 'AddLibraryDialog';

export { AddLibraryDialog };
