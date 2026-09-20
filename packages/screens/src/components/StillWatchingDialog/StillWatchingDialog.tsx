import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import type { StillWatchingDialogProps } from './StillWatchingDialog.types';

const A_SECOND = 1000;

/**
 * Asks whether anybody is still there, before playing another episode that nobody chose.
 *
 * Shown instead of starting the next episode rather than over the top of one already playing, which
 * is what makes it worth doing at all: nothing is transcoded for an empty room, and nothing is
 * written to continue-watching for an episode nobody saw. Answering carries on from exactly where
 * the run left off.
 *
 * The countdown is shown rather than hidden, because a prompt that closes a film without warning is
 * worse than one that says it is about to.
 *
 * It stops at nought rather than running past it. Left to keep counting, every further second was a
 * new value for the effect below to react to, so giving up was called once a second for as long as
 * the question stayed up rather than once when the time ran out. What is left is reset while
 * rendering rather than in an effect, so that asking again after a run that expired does not give
 * up on the spot against the nought the last one finished on.
 *
 * @param isOpen - Whether the question is being asked.
 * @param title - The episode waiting to be played, so the answer is an informed one.
 * @param secondsToAnswer - How long before it gives up on its own.
 * @param onCarryOn - Called when somebody says they are still there.
 * @param onGiveUp - Called when nobody answers in time.
 * @returns The dialog.
 */
const StillWatchingDialog = ({
  isOpen,
  title,
  secondsToAnswer,
  onCarryOn,
  onGiveUp,
}: StillWatchingDialogProps) => {
  const [left, setLeft] = useState(secondsToAnswer);
  const [wasAsked, setWasAsked] = useState(isOpen);

  if (isOpen !== wasAsked) {
    setWasAsked(isOpen);
    setLeft(secondsToAnswer);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setInterval(() => {
      setLeft((held) => Math.max(0, held - 1));
    }, A_SECOND);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && left <= 0) {
      onGiveUp();
    }
  }, [isOpen, left, onGiveUp]);

  return (
    <Dialog label="Are you still watching?" isOpen={isOpen} onClose={onGiveUp}>
      <DialogTitle title="Are you still watching?" />

      <DialogContent>
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-relaxed text-text">
            {`${title} is up next. Nothing will be played, and nothing marked as watched, unless you say so.`}
          </p>

          <p className="text-xs text-text-muted" aria-live="polite">
            {left <= 0
              ? 'Stopping…'
              : `Stopping in ${Math.max(0, left).toString()} second${left === 1 ? '' : 's'}.`}
          </p>
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ label: 'Stop', onChoose: onGiveUp }}
        confirm={{ label: 'Still watching', onChoose: onCarryOn }}
      />
    </Dialog>
  );
};

StillWatchingDialog.displayName = 'StillWatchingDialog';

export { StillWatchingDialog };
