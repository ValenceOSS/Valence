import { useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import type { RunLibraryJobDialogProps } from './RunLibraryJobDialog.types';

/**
 * Asks which libraries a library job should run against before it starts, every one of them ticked
 * to begin with, so running it on all of them is still one press. A job that deletes something says
 * so, and its button says what it is about to do.
 *
 * @param definition - The job to run, or null while the dialog is shut.
 * @param libraries - The libraries it can run against.
 * @param onClose - Called when it is dismissed.
 * @param onRun - Called with the job and the ids of the libraries chosen.
 */
const RunLibraryJobDialog = ({
  definition,
  libraries,
  onClose,
  onRun,
}: RunLibraryJobDialogProps) => {
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(libraries.map((library) => library.id)),
  );
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const kind = definition?.kind ?? null;

  if (kind !== openedFor) {
    setOpenedFor(kind);
    setChosen(new Set(libraries.map((library) => library.id)));
  }

  const picked = libraries.filter((library) => chosen.has(library.id)).map((library) => library.id);

  return (
    <Dialog
      label={definition === null ? 'Run this job' : `Run ${definition.label}`}
      isOpen={definition !== null}
      onClose={onClose}
    >
      {definition === null ? null : (
        <>
          <DialogTitle
            title={definition.destructive ? `${definition.label}?` : definition.label}
            detail={
              definition.destructive
                ? `${definition.description} This cannot be undone.`
                : definition.description
            }
          />

          <DialogContent>
            <LibraryPicker libraries={libraries} chosen={chosen} onChange={setChosen} />
          </DialogContent>

          <DialogFooter
            dismiss={{ onChoose: onClose }}
            confirm={{
              label:
                picked.length === libraries.length
                  ? `${definition.destructive ? definition.label : 'Run'} on every library`
                  : `${definition.destructive ? definition.label : 'Run'} on ${picked.length.toString()} ${picked.length === 1 ? 'library' : 'libraries'}`,
              onChoose: () => {
                onRun(definition.kind, picked);
              },
              isDisabled: picked.length === 0,
            }}
          />
        </>
      )}
    </Dialog>
  );
};

RunLibraryJobDialog.displayName = 'RunLibraryJobDialog';

export { RunLibraryJobDialog };
