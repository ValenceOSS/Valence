import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { notify } from '@ValenceUI/notify';
import { correctMatch } from '@ValenceClient/library/fetchLibrary';
import type { MergeTitlesDialogProps } from './MergeTitlesDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Merges films chosen that are really one film, such as two cuts matched to different entries:
 * one is chosen as the film they all are, and every other is matched to it, so each becomes one of
 * its versions.
 *
 * @param films - The films chosen, or nothing while it is closed.
 * @param onClose - Closes it.
 * @param onMerged - Told the films were merged.
 */
const MergeTitlesDialog = ({ films, onClose, onMerged }: MergeTitlesDialogProps) => {
  const list = films ?? [];
  const [chosen, setChosen] = useState<string | null>(
    list.find((film) => film.externalId !== null)?.mediaId ?? null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const target = list.find((film) => film.mediaId === chosen);

  const merge = async () => {
    const externalId = target?.externalId ?? null;

    if (target === undefined || externalId === null) {
      return;
    }

    setIsBusy(true);

    const problems = [];

    for (const film of list) {
      if (film.mediaId !== target.mediaId && film.externalId !== externalId) {
        const outcome = await correctMatch(film.mediaId, externalId, 'movie');

        if ('problem' in outcome) {
          problems.push(outcome.problem);
        }
      }
    }

    setIsBusy(false);

    if (problems.length > 0) {
      notify.failed(problems[0] ?? '');
    } else {
      notify.worked(say('screens.adminArea.mergeTitles.mergedIntoName', { name: target.name }));
    }

    onMerged();
    onClose();
  };

  return (
    <Dialog
      label={sayCount('screens.adminArea.mergeTitles.count.mergeFilms', list.length)}
      isOpen={films !== null}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={sayCount('screens.adminArea.mergeTitles.count.mergeFilms', list.length)}
      />
      <DialogContent className="flex flex-col gap-3">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.mergeTitles.keepWhichMatch')}
        </p>
        <ul className="flex flex-col gap-1">
          {list.map((film) => {
            const named = film.year === null ? film.name : `${film.name} (${film.year.toString()})`;

            return (
              <li key={film.mediaId}>
                <Button
                  variant="row"
                  size="none"
                  isActive={film.mediaId === chosen}
                  disabled={film.externalId === null}
                  onClick={() => {
                    setChosen(film.mediaId);
                  }}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="truncate text-sm">
                    {film.externalId === null
                      ? say('screens.adminArea.mergeTitles.unmatchedFilm', { name: named })
                      : named}
                  </span>
                  {film.externalId === null ? null : (
                    <Badge size="sm">
                      {[say('screens.adminArea.sourcedField.tmdb'), film.externalId].join(' ')}
                    </Badge>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: sayCount('screens.adminArea.mergeTitles.count.mergeFilms', list.length),
          isDisabled: target?.externalId === null || target === undefined,
          isLoading: isBusy,
          onChoose: () => {
            void merge();
          },
        }}
      />
    </Dialog>
  );
};

MergeTitlesDialog.displayName = 'MergeTitlesDialog';

export { MergeTitlesDialog };
