import { useState } from 'react';
import { moveMedia } from '@ValenceClient/library/fetchLibrary';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SelectField } from '@ValenceUI/SelectField';
import { notify } from '@ValenceUI/notify';
import type { MoveToLibraryDialogProps } from './MoveToLibraryDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Moves a film, a programme or one file into another library of films or shows, for something a
 * scan filed in the wrong one. The files move on the disk into the other library's folder, at the
 * same place under it, and Valence moves them with them rather than forgetting and finding them
 * again, so what everybody has watched of them stays; the other library then reads them again as
 * what it holds, a programme there and a film here.
 *
 * @param target - What to move, what it is called and the library it is in, or nothing while shut.
 * @param libraries - Every library, of which those of films or shows other than its own are offered.
 * @param onClose - Called when it is dismissed.
 * @param onMoved - Told the library they went to and the job reading them there, once they have.
 */
const MoveToLibraryDialog = ({ target, libraries, onClose, onMoved }: MoveToLibraryDialogProps) => {
  const offered = libraries.filter(
    (library) =>
      library.id !== target?.libraryId && (library.kind === 'movies' || library.kind === 'shows'),
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const libraryId = offered.some((library) => library.id === chosen)
    ? (chosen ?? '')
    : (offered[0]?.id ?? '');
  const title =
    target === null
      ? say('screens.adminArea.moveToLibraryDialog.moveToAnotherLibrary')
      : say('screens.adminArea.moveToLibraryDialog.moveNameToAnotherLibrary', {
          name: target.name,
        });

  return (
    <DialogCompanion
      label={title}
      isOpen={target !== null}
      onClose={() => {
        setProblem(null);
        onClose();
      }}
    >
      <DialogTitle
        size="compact"
        title={title}
        detail={target === null ? '' : sayCount('common.count.files', target.items.length)}
      />

      <DialogContent className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-text-muted">
          {say('screens.adminArea.moveToLibraryDialog.theFilesMoveIntoThatLibrary')}
        </p>

        {offered.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.moveToLibraryDialog.thereIsNoOtherLibrary')}
          </p>
        ) : (
          <SelectField
            label={say('common.whichLibrary')}
            options={offered.map((library) => ({ id: library.id, label: library.name }))}
            value={libraryId}
            onSelect={setChosen}
          />
        )}
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.adminArea.moveToLibraryDialog.move'),
          isDisabled: target === null || libraryId === '',
          isLoading: isMoving,
          onChoose: () => {
            if (target === null || libraryId === '') {
              return;
            }

            setIsMoving(true);
            setProblem(null);

            void moveMedia(
              target.items.map((item) => item.id),
              libraryId,
            )
              .then((moved) => {
                if ('problem' in moved) {
                  setProblem(moved.problem);

                  return;
                }

                notify.worked(
                  say('screens.adminArea.moveToLibraryDialog.nameMovedToLibrary', {
                    name: target.name,
                    library: offered.find((library) => library.id === libraryId)?.name ?? '',
                  }),
                );
                onMoved(libraryId, moved.jobId);
              })
              .finally(() => {
                setIsMoving(false);
              });
          },
        }}
      />
    </DialogCompanion>
  );
};

MoveToLibraryDialog.displayName = 'MoveToLibraryDialog';

export { MoveToLibraryDialog };
