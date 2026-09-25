import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { LIBRARY_PARTS_BY_KIND } from '@ValenceContracts/schemas/LibraryPart';
import { readsAgainAfterClearing } from '@ValenceCore/functions/readsAgainAfterClearing';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { describeLibraryPart } from '@ValenceScreens/components/AdminArea/describeLibraryPart';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import type { ClearLibraryPartsDialogProps } from './ClearLibraryPartsDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';

const GROUPS: { nameKey: StringKey; parts: LibraryPart[] }[] = [
  {
    nameKey: 'admin.clearLibraryPartsDialog.aboutEachTitle',
    parts: ['descriptions', 'cast', 'ageRatings', 'trailers'],
  },
  { nameKey: 'admin.clearLibraryPartsDialog.pictures', parts: ['artwork', 'logos'] },
  {
    nameKey: 'admin.clearLibraryPartsDialog.madeByValence',
    parts: ['previews', 'scrubPreviews', 'intros'],
  },
  {
    nameKey: 'admin.clearLibraryPartsDialog.music',
    parts: ['albumCovers', 'artistPictures', 'lyrics', 'musicVideos'],
  },
];

/**
 * Asks which libraries to clear, and which parts of them, before erasing anything. Every library is
 * ticked to begin with and no part is, so nothing goes that was not chosen.
 *
 * Only the parts the ticked libraries actually have are offered — album covers for music, trailers
 * for films and shows — so the list shrinks and grows as libraries are ticked and cleared, and a part
 * that stops being offered stops being chosen. Anything whose return means reading every file again
 * says so before it is agreed to, because on a large library that is hours.
 *
 * @param definition - The clearing job, or null while the dialog is shut.
 * @param libraries - The libraries it can clear parts of.
 * @param onClose - Called when it is dismissed.
 * @param onClear - Called with the job, the ids of the libraries chosen and the parts chosen.
 */
const ClearLibraryPartsDialog = ({
  definition,
  libraries,
  onClose,
  onClear,
}: ClearLibraryPartsDialogProps) => {
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(libraries.map((library) => library.id)),
  );
  const [ticked, setTicked] = useState<ReadonlySet<LibraryPart>>(() => new Set());
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const kind = definition?.kind ?? null;

  if (kind !== openedFor) {
    setOpenedFor(kind);
    setChosen(new Set(libraries.map((library) => library.id)));
    setTicked(new Set());
  }

  const picked = libraries.filter((library) => chosen.has(library.id));
  const offered = new Set(picked.flatMap((library) => LIBRARY_PARTS_BY_KIND[library.kind]));
  const parts = GROUPS.flatMap((group) => group.parts).filter(
    (part) => offered.has(part) && ticked.has(part),
  );

  return (
    <Dialog
      label={
        definition === null ? say('admin.clearLibraryPartsDialog.fallbackLabel') : definition.label
      }
      isOpen={definition !== null}
      onClose={onClose}
    >
      {definition === null ? null : (
        <>
          <DialogTitle
            title={say('admin.clearLibraryPartsDialog.title', { job: definition.label })}
            detail={say('admin.clearLibraryPartsDialog.detail', {
              description: definition.description,
            })}
          />

          <DialogContent className="flex flex-col gap-6">
            <LibraryPicker libraries={libraries} chosen={chosen} onChange={setChosen} />

            <fieldset className="flex flex-col gap-5">
              <legend className="mb-3 text-xs uppercase tracking-[0.14em] text-text-muted">
                {say('admin.clearLibraryPartsDialog.whatToClear')}
              </legend>

              {offered.size === 0 ? (
                <p className="text-sm text-text-muted">
                  {picked.length === 0
                    ? say('admin.clearLibraryPartsDialog.chooseLibrary')
                    : say('admin.clearLibraryPartsDialog.nothingToClear')}
                </p>
              ) : null}

              {GROUPS.filter((group) => group.parts.some((part) => offered.has(part))).map(
                (group) => (
                  <div key={group.nameKey} className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-text">{say(group.nameKey)}</span>

                    {group.parts
                      .filter((part) => offered.has(part))
                      .map((part) => (
                        <Checkbox
                          key={part}
                          {...describeLibraryPart(part)}
                          checked={ticked.has(part)}
                          onCheckedChange={(isChecked) => {
                            const next = new Set(ticked);

                            if (isChecked) {
                              next.add(part);
                            } else {
                              next.delete(part);
                            }

                            setTicked(next);
                          }}
                        />
                      ))}
                  </div>
                ),
              )}
            </fieldset>

            {readsAgainAfterClearing(parts) ? (
              <p role="note" className="text-sm text-text-muted">
                {say('admin.clearLibraryPartsDialog.readsAgain')}
              </p>
            ) : null}
          </DialogContent>

          <DialogFooter
            dismiss={{ onChoose: onClose }}
            confirm={{
              label: sayCount('admin.clearLibraryPartsDialog.confirm', parts.length),
              onChoose: () => {
                onClear(
                  definition.kind,
                  picked.map((library) => library.id),
                  parts,
                );
              },
              isDisabled: picked.length === 0 || parts.length === 0,
            }}
          />
        </>
      )}
    </Dialog>
  );
};

ClearLibraryPartsDialog.displayName = 'ClearLibraryPartsDialog';

export { ClearLibraryPartsDialog };
