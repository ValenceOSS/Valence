import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { bestMatchOf } from '@ValenceClient/admin/bestMatchOf';
import { fetchTitleCandidates } from '@ValenceClient/admin/fetchTitleCandidates';
import { correctMatch } from '@ValenceClient/library/fetchLibrary';
import type { QuickMatchDialogProps } from './QuickMatchDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

type Outcome = { kind: 'looking' } | { kind: 'matched'; to: string } | { kind: 'left' };

/**
 * Matches the unmatched titles chosen to TMDB where one entry clearly fits each, one after another,
 * and leaves the rest for a person, each with Fix match beside it. Nothing is matched until it is
 * started, and it says how each went as it goes.
 *
 * @param titles - The unmatched titles, or nothing while it is closed.
 * @param onClose - Closes it.
 * @param onFixMatch - Opens Fix match for a title it left alone.
 * @param onMatched - Told it matched at least one, once it is done.
 */
const QuickMatchDialog = ({ titles, onClose, onFixMatch, onMatched }: QuickMatchDialogProps) => {
  const [outcomes, setOutcomes] = useState<ReadonlyMap<string, Outcome>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const list = titles ?? [];
  const isDone = !isRunning && outcomes.size === list.length && list.length > 0;
  const matched = [...outcomes.values()].filter((one) => one.kind === 'matched').length;

  const run = async () => {
    setIsRunning(true);

    let held = new Map<string, Outcome>();
    const tell = (mediaId: string, outcome: Outcome) => {
      held = new Map(held).set(mediaId, outcome);
      setOutcomes(held);
    };

    for (const title of list) {
      tell(title.mediaId, { kind: 'looking' });

      const found = await fetchTitleCandidates(title.name, title.kind, 1);
      const best =
        'problem' in found
          ? null
          : bestMatchOf({ title: title.name, year: title.year }, found.matches);
      const corrected =
        best === null ? null : await correctMatch(title.mediaId, best.entry.externalId, title.kind);

      tell(
        title.mediaId,
        best !== null && corrected !== null && !('problem' in corrected)
          ? {
              kind: 'matched',
              to:
                best.entry.year === null
                  ? best.entry.title
                  : `${best.entry.title} (${best.entry.year.toString()})`,
            }
          : { kind: 'left' },
      );
    }

    setIsRunning(false);

    if ([...held.values()].some((one) => one.kind === 'matched')) {
      onMatched();
    }
  };

  const close = () => {
    setOutcomes(new Map());
    onClose();
  };

  return (
    <Dialog
      label={sayCount('screens.adminArea.quickMatch.count.matchTitles', list.length)}
      isOpen={titles !== null}
      onClose={close}
      holdsOutsideClicks={isRunning}
    >
      <DialogTitle
        size="compact"
        title={sayCount('screens.adminArea.quickMatch.count.matchTitles', list.length)}
      />
      <DialogContent className="flex flex-col gap-3">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.quickMatch.howItDecides')}
        </p>
        <ul className="flex flex-col divide-y divide-line">
          {list.map((title) => {
            const outcome = outcomes.get(title.mediaId);

            return (
              <li key={title.mediaId} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate font-body text-sm text-text">
                  {title.year === null ? title.name : `${title.name} (${title.year.toString()})`}
                </span>
                {outcome === undefined ? (
                  <Badge size="sm">{say('common.waiting')}</Badge>
                ) : outcome.kind === 'looking' ? (
                  <Badge size="sm" tone="busy">
                    {say('screens.adminArea.quickMatch.lookingNow')}
                  </Badge>
                ) : outcome.kind === 'matched' ? (
                  <Badge size="sm" tone="success">
                    {say('screens.adminArea.quickMatch.matchedToName', { name: outcome.to })}
                  </Badge>
                ) : (
                  <span className="flex items-center gap-2">
                    <Badge size="sm" tone="warning">
                      {say('screens.adminArea.quickMatch.needsALook')}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      label={say('screens.adminArea.quickMatch.fixMatchFor', { name: title.name })}
                      onClick={() => {
                        onFixMatch(title.mediaId);
                      }}
                    >
                      {say('screens.adminArea.mediaTitlePage.fixMatch')}
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </DialogContent>
      <DialogFooter
        lead={
          isDone ? (
            <span className="text-sm text-text-muted">
              {say('screens.adminArea.quickMatch.matchedCountOfTotal', {
                matched: matched.toLocaleString(),
                total: list.length.toLocaleString(),
              })}
            </span>
          ) : null
        }
        dismiss={{ onChoose: close }}
        {...(isDone
          ? {}
          : {
              confirm: {
                label: sayCount('screens.adminArea.quickMatch.count.matchTitles', list.length),
                onChoose: () => {
                  void run();
                },
                isLoading: isRunning,
                isDisabled: list.length === 0,
              },
            })}
      />
    </Dialog>
  );
};

QuickMatchDialog.displayName = 'QuickMatchDialog';

export { QuickMatchDialog };
