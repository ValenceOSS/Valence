import { useEffect, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { StatusMark } from '@ValenceUI/StatusMark';

const SETTLES_AFTER_MS = 180;

/**
 * The mark of something done: the status mark arrives as the dashes Valence waits with
 * everywhere else, then joins them up and draws its tick, so a toast reads as the work settling
 * rather than a badge appearing. Arrives already settled where motion is reduced.
 */
const DoneMark = () => {
  const isStill = useReducedMotionConfig() === true;
  const [isSettled, setIsSettled] = useState(isStill);

  useEffect(() => {
    const settles = setTimeout(() => {
      setIsSettled(true);
    }, SETTLES_AFTER_MS);

    return () => {
      clearTimeout(settles);
    };
  }, []);

  return (
    <span aria-hidden className="relative flex size-5 shrink-0 items-center justify-center">
      <StatusMark state={isSettled ? 'done' : 'loading'} size={18} />
    </span>
  );
};

DoneMark.displayName = 'DoneMark';

export { DoneMark };
