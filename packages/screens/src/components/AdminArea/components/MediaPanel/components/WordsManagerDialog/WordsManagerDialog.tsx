import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { editTitlesInParts } from '@ValenceClient/admin/editTitlesInParts';
import { fetchTitleKeys } from '@ValenceClient/admin/fetchTitleKeys';
import { undoTitlesInParts } from '@ValenceClient/admin/undoTitlesInParts';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { WordRow } from './components/WordRow/WordRow';
import type { WordsManagerDialogProps } from './WordsManagerDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const KINDS = [
  { id: 'genres', label: say('common.genres'), filter: 'genre' },
  { id: 'tags', label: say('screens.adminArea.titleDetails.tags'), filter: 'tag' },
] as const;

/**
 * Renames and removes a library's genres and tags on every title that carries them, so a library
 * read from several catalogues can be tidied in one place: renaming one to a name already in use
 * merges the two. Removing asks first, and each change is one change set, undone from the message
 * that follows or from a title's history.
 *
 * @param libraryId - The library, or nothing while it is closed.
 * @param onClose - Closes it.
 */
const WordsManagerDialog = ({ libraryId, onClose }: WordsManagerDialogProps) => {
  const cache = useQueryClient();
  const [kind, setKind] = useState<(typeof KINDS)[number]>(KINDS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ word: string; count: number } | null>(null);
  const words = useQuery({
    ...adminQueries.titleValues(kind.id, libraryId ?? undefined),
    enabled: libraryId !== null,
  });

  /**
   * Replaces a word with another, or takes it off, on every title of the library that carries it.
   *
   * @param word - The genre or tag.
   * @param next - What it is to be, or nothing to take it off.
   */
  const change = async (word: string, next: string) => {
    if (libraryId === null) {
      return;
    }

    setBusy(word);

    try {
      const keys = await fetchTitleKeys({
        libraryId,
        sort: 'title',
        isDescending: false,
        search: '',
        show: 'all',
        filters: [`${kind.filter}:${word}`],
      });
      const outcome = await editTitlesInParts(
        keys.titles.map((title) => ({ mediaId: title.leadId, scope: 'title' as const })),
        { replace: { field: kind.id, find: word, with: next, matchCase: false } },
        'titles',
      );
      const titles = sayCount('common.count.titles', outcome.changed.length);

      await cache.invalidateQueries({ queryKey: adminQueries.key });
      notify.worked(
        next === ''
          ? say('screens.adminArea.wordsManager.wordRemovedFromTitles', { word, titles })
          : say('screens.adminArea.wordsManager.wordRenamedToNextOnTitles', { word, next, titles }),
        {
          id: `words-${outcome.changeSetId}`,
          action: {
            label: say('common.undo'),
            onPress: () => {
              void undoTitlesInParts(outcome.changeSetId, outcome.changed)
                .then(async () => cache.invalidateQueries({ queryKey: adminQueries.key }))
                .catch((error: Error) => {
                  notify.failed(error.message);
                });
            },
          },
        },
      );
    } catch (error) {
      notify.failed(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const values = words.data?.values ?? [];

  return (
    <Dialog
      label={say('screens.adminArea.wordsManager.genresAndTags')}
      isOpen={libraryId !== null}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.wordsManager.genresAndTags')}
        below={
          <SegmentedRow
            label={say('screens.adminArea.wordsManager.genresAndTags')}
            size="sm"
            items={KINDS}
            value={kind.id}
            onSelect={(next) => {
              setKind(KINDS.find((one) => one.id === next) ?? KINDS[0]);
            }}
          />
        }
      />

      <DialogContent className="flex flex-col gap-3">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.wordsManager.renameOrMergeAcrossTheLibrary')}
        </p>
        {words.isPending ? (
          <Spinner isCentered size="sm" label={say('common.loading')} />
        ) : values.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            {say('screens.adminArea.wordsManager.noneInThisLibrary')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {values.map((one) => (
              <WordRow
                key={`${kind.id}:${one.value}`}
                word={one.value}
                count={one.count}
                isBusy={busy === one.value}
                onRename={(next) => {
                  void change(one.value, next);
                }}
                onRemove={() => {
                  setRemoving({ word: one.value, count: one.count });
                }}
              />
            ))}
          </ul>
        )}
      </DialogContent>

      <DialogFooter dismiss={{ onChoose: onClose }} />

      <ConfirmDialog
        title={say('screens.adminArea.wordsManager.removeWordQuestion', {
          word: removing?.word ?? '',
          titles: sayCount('common.count.titles', removing?.count ?? 0),
        })}
        detail={say('screens.adminArea.wordsManager.itIsTakenOffEveryTitle')}
        confirmLabel={say('screens.adminArea.wordsManager.remove')}
        isDestructive
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          if (removing !== null) {
            void change(removing.word, '');
          }

          setRemoving(null);
        }}
      />
    </Dialog>
  );
};

WordsManagerDialog.displayName = 'WordsManagerDialog';

export { WordsManagerDialog };
