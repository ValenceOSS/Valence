import { X as XIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Icon } from '@ValenceUI/Icon';
import { fetchWordRules } from '@ValenceClient/admin/fetchWordRules';
import { saveWordRules } from '@ValenceClient/admin/saveWordRules';
import type { WordRule } from '@ValenceContracts/schemas/WordRule';
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
 * merges the two, and either can be kept as a rule every later scan follows. Removing asks first, and each change is one change set, undone from the message
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
  const [isForLater, setIsForLater] = useState(true);
  const rules = useQuery({
    queryKey: ['word-rules', libraryId],
    queryFn: () => fetchWordRules(libraryId ?? ''),
    enabled: libraryId !== null,
  });
  const held = rules.data ?? [];

  /**
   * Keeps a new list of the library's rules, saying where it could not.
   *
   * @param next - Every rule.
   */
  const keepRules = async (next: readonly WordRule[]) => {
    if (libraryId === null) {
      return;
    }

    const problem = await saveWordRules(libraryId, next);

    if (problem !== null) {
      notify.failed(problem.problem);
    }

    await cache.invalidateQueries({ queryKey: ['word-rules', libraryId] });
  };
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

      if (kind.id === 'genres' && isForLater) {
        await keepRules([
          ...held.filter((rule) => rule.find.toLocaleLowerCase() !== word.toLocaleLowerCase()),
          { field: 'genres', find: word, replace: next },
        ]);
      }

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
            {kind.id === 'genres' ? (
              <li className="pb-2">
                <Checkbox
                  label={say('screens.adminArea.wordsManager.alsoForLaterScans')}
                  checked={isForLater}
                  onCheckedChange={setIsForLater}
                  className="text-sm"
                />
              </li>
            ) : null}
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

      {kind.id === 'genres' && held.length > 0 ? (
        <DialogContent className="flex flex-col gap-2 border-t border-[var(--surface-line)]">
          <h3 className="font-body text-sm font-medium text-text">
            {say('screens.adminArea.wordsManager.rulesForLaterScans')}
          </h3>
          <ul className="flex flex-col gap-1">
            {held.map((rule) => (
              <li key={rule.find} className="flex items-center justify-between gap-2">
                <span className="font-body text-sm text-text-muted">
                  {rule.replace === ''
                    ? say('screens.adminArea.wordsManager.findIsTakenOut', { find: rule.find })
                    : say('screens.adminArea.wordsManager.findBecomesReplace', {
                        find: rule.find,
                        replace: rule.replace,
                      })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={say('screens.adminArea.wordsManager.forgetTheRuleFor', {
                    find: rule.find,
                  })}
                  onClick={() => {
                    void keepRules(held.filter((one) => one !== rule));
                  }}
                >
                  <Icon of={XIcon} size={15} />
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      ) : null}

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
