import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { FormField } from '@ValenceUI/FormField';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { Icon } from '@ValenceUI/Icon';
import { Folder as FolderIcon } from '@keyline-icons/react';
import { FolderBrowser } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/FolderBrowser';
import { SELECTABLE_LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { LIBRARY_PRESETS } from './LIBRARY_PRESETS';
import { createLibrary } from '@ValenceClient/library/fetchLibrary';
import { validateAddLibraryForm } from './validateAddLibraryForm';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { AddLibraryDialogProps, AddLibraryFormErrors } from './AddLibraryDialog.types';

const CUSTOM = 'custom';

const KIND_LABELS: Record<LibraryKind, string> = {
  movies: 'Movies',
  shows: 'Shows',
  music: 'Music',
  books: 'Books',
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
  const [name, setName] = useState('');
  const [preset, setPreset] = useState<string>('movies');
  const [customKind, setCustomKind] = useState<LibraryKind>('shows');
  const [flavour, setFlavour] = useState('');
  const [path, setPath] = useState('');
  const [errors, setErrors] = useState<AddLibraryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);

  const reset = () => {
    setName('');
    setPreset('movies');
    setCustomKind('shows');
    setFlavour('');
    setPath('');
    setErrors({});
    setIsBrowsing(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    const isCustom = preset === CUSTOM;
    const found = validateAddLibraryForm({
      name,
      path,
      ...(isCustom ? { flavour } : {}),
    });

    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const chosen = LIBRARY_PRESETS.find((entry) => entry.id === preset);
      const library = await createLibrary(
        isCustom
          ? { name, kind: customKind, flavour: flavour.trim(), path }
          : {
              name,
              kind: chosen?.kind ?? 'movies',
              ...(chosen?.flavour === null || chosen === undefined
                ? {}
                : { flavour: chosen.flavour }),
              path,
            },
      );

      onCreated(library);
      reset();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'The library could not be added.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogCompanion label="Add a library" isOpen={isOpen} onClose={close}>
      <DialogTitle size="compact" title="Add a library" />

      <DialogContent className="flex flex-col gap-5">
        <TextField
          label="Name"
          value={name}
          onValueChange={setName}
          {...(errors.name === undefined ? {} : { error: errors.name })}
        />

        <FormField
          label="Type"
          description="What this library holds, which decides how it reads and what it is called."
        >
          <div className="flex flex-wrap gap-2">
            {[...LIBRARY_PRESETS, { id: CUSTOM, label: 'Custom' }].map((entry) => (
              <Button
                key={entry.id}
                size="sm"
                variant={entry.id === preset ? 'primary' : 'secondary'}
                aria-pressed={entry.id === preset}
                onClick={() => {
                  setPreset(entry.id);
                }}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        </FormField>

        {preset === CUSTOM ? (
          <>
            <TextField
              label="Type name"
              value={flavour}
              onValueChange={setFlavour}
              placeholder="Documentaries"
              description="What to call this kind of library."
              {...(errors.flavour === undefined ? {} : { error: errors.flavour })}
            />

            <FormField label="Reads like" description="Which of the built-in kinds it is read as.">
              <div className="flex flex-wrap gap-2">
                {SELECTABLE_LIBRARY_KINDS.map((entry) => (
                  <Button
                    key={entry}
                    size="sm"
                    variant={entry === customKind ? 'primary' : 'secondary'}
                    aria-pressed={entry === customKind}
                    onClick={() => {
                      setCustomKind(entry);
                    }}
                  >
                    {`Reads like ${KIND_LABELS[entry].toLowerCase()}`}
                  </Button>
                ))}
              </div>
            </FormField>
          </>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label="Path"
                value={path}
                onValueChange={setPath}
                placeholder="/media/movies"
                description="A folder on the machine running Valence, not your browser."
                {...(errors.path === undefined ? {} : { error: errors.path })}
              />
            </div>

            {isBrowsing ? null : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsBrowsing(true);
                }}
              >
                <Icon of={FolderIcon} size={14} />
                Browse
              </Button>
            )}
          </div>

          {isBrowsing ? (
            <FolderBrowser
              start={path}
              onChoose={(chosen) => {
                setPath(chosen);
                setIsBrowsing(false);
              }}
              onCancel={() => {
                setIsBrowsing(false);
              }}
            />
          ) : null}
        </div>

        {errors.submit === undefined ? null : (
          <p role="alert" className="text-sm text-danger">
            {errors.submit}
          </p>
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: close, isDisabled: isSubmitting }}
        confirm={{
          label: 'Add library',
          onChoose: () => {
            void submit();
          },
          isLoading: isSubmitting,
        }}
      />
    </DialogCompanion>
  );
};

AddLibraryDialog.displayName = 'AddLibraryDialog';

export { AddLibraryDialog };
