import { useEffect, useRef, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { KeyboardEvent } from 'react';
import type { LayoutTrial } from './KeepTheLayout.types';

const TICK_MS = 250;

/**
 * How many whole seconds are left before a trial runs out.
 *
 * @param trial - The trial.
 * @returns The seconds left, never fewer than none.
 */
const secondsLeftOf = (trial: LayoutTrial): number =>
  Math.max(0, Math.ceil((trial.endsAt - Date.now()) / 1000));

/**
 * Asks a television that has just been switched to the web app whether to keep it, counting down
 * to going back to the TV layout, as a screen asks whether to keep a new resolution.
 *
 * The question only comes where the page was sent on trial, which the server does for a
 * television's browser that chose the web app and has not kept it. Where nothing is pressed in
 * time — the page drew but the remote can reach nothing on it — the page goes back by itself. The
 * remote starts on keeping it, and left and right move between the two answers, since a remote has
 * arrows and no tab key. A page behind that takes the remote as it draws, such as a sign-in form, is
 * given it back, since nothing else can be answered while the question is up.
 */
const KeepTheLayout = () => {
  const [trial] = useState(() => window.valenceLayoutTrial);
  const [left, setLeft] = useState(() => (trial === undefined ? 0 : secondsLeftOf(trial)));
  const [isAnswered, setIsAnswered] = useState(false);
  const answers = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trial === undefined) {
      return;
    }

    const tick = setInterval(() => {
      setLeft(secondsLeftOf(trial));

      if (answers.current !== null && !answers.current.contains(document.activeElement)) {
        answers.current.querySelector('button')?.focus();
      }
    }, TICK_MS);
    const landing = requestAnimationFrame(() => {
      answers.current?.querySelector('button')?.focus();
    });

    return () => {
      clearInterval(tick);
      cancelAnimationFrame(landing);
    };
  }, [trial]);

  if (trial === undefined || isAnswered) {
    return null;
  }

  const keep = () => {
    setIsAnswered(true);
    trial.keep();
  };
  const goBack = () => {
    setIsAnswered(true);
    trial.goBack();
  };
  const across = (event: KeyboardEvent<HTMLDivElement>) => {
    const [keepIt, backAgain] = answers.current?.querySelectorAll('button') ?? [];

    if (event.key === 'ArrowLeft') {
      keepIt?.focus();
    } else if (event.key === 'ArrowRight') {
      backAgain?.focus();
    }
  };

  return (
    <Dialog label={say('screens.keepTheLayout.keepTheDesktopLayout')} isOpen onClose={goBack}>
      <DialogTitle title={say('screens.keepTheLayout.keepTheDesktopLayout')} />

      <DialogContent>
        <p className="font-body text-sm text-text-muted">
          {sayCount('screens.keepTheLayout.goingBackIn', left)}
        </p>

        <div ref={answers} className="mt-6 flex flex-wrap gap-3" onKeyDown={across}>
          <Button variant="confirm" onClick={keep}>
            {say('screens.keepTheLayout.keepTheDesktopLayoutAnswer')}
          </Button>
          <Button variant="secondary" onClick={goBack}>
            {say('screens.keepTheLayout.goBackToTheTvLayout')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

KeepTheLayout.displayName = 'KeepTheLayout';

export { KeepTheLayout };
