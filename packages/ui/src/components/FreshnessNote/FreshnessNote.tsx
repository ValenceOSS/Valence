import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { fadeVariants, stillTransition } from '@ValenceUI/animations/reveal';
import { Spinner } from '@ValenceUI/Spinner';
import { say } from '@ValenceI18n/say';
import type { FreshnessNoteProps } from './FreshnessNote.types';

const UP_TO_DATE_FOR_MS = 3000;

/**
 * Says, in a block's heading, that what it shows is being checked against the server, and then for
 * a moment that it is up to date — or, where the server did not answer, that it could not check.
 *
 * @param isChecking - Whether the block is asking the server again while it shows what it had.
 * @param couldNotCheck - Whether the last time it asked, the server did not answer.
 */
const FreshnessNote = ({ isChecking, couldNotCheck }: FreshnessNoteProps) => {
  const [hasJustChecked, setHasJustChecked] = useState(false);
  const wasChecking = useRef(isChecking);

  useEffect(() => {
    const hasFinished = wasChecking.current && !isChecking;

    wasChecking.current = isChecking;

    if (!hasFinished || couldNotCheck) {
      return undefined;
    }

    setHasJustChecked(true);

    const fading = setTimeout(() => {
      setHasJustChecked(false);
    }, UP_TO_DATE_FOR_MS);

    return () => {
      clearTimeout(fading);
    };
  }, [isChecking, couldNotCheck]);

  const said = isChecking
    ? say('ui.freshnessNote.checkingForChanges')
    : couldNotCheck
      ? say('ui.freshnessNote.couldNotCheckForChanges')
      : hasJustChecked
        ? say('common.upToDate')
        : null;

  return (
    <span role="status" className="flex min-w-0 items-center">
      <AnimatePresence mode="wait" initial={false}>
        {said === null ? null : (
          <motion.span
            key={said}
            variants={fadeVariants}
            initial="hidden"
            animate="shown"
            exit="gone"
            transition={stillTransition}
            className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs text-text-muted"
          >
            {isChecking ? <Spinner size="xs" label={said} /> : null}
            <span className="truncate">{said}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

FreshnessNote.displayName = 'FreshnessNote';

export { FreshnessNote };
