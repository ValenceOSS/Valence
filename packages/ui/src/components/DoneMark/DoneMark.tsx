import { motion, useReducedMotionConfig } from 'motion/react';
import { CircleCheck as CircleCheckIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { say } from '@ValenceI18n/say';

const SPINNER_LEAVES = { delay: 0.3, duration: 0.15 } as const;

/**
 * The mark of something done, arriving as the spinner Valence shows everywhere else turning, which
 * gives way to the icon set's circled tick drawn stroke by stroke — the circle closing and the tick following — so a
 * toast reads as the work settling rather than a badge appearing. Every line of it is the icon
 * set's own. Arrives already settled where motion is reduced.
 */
const DoneMark = () => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <span aria-hidden className="relative flex size-5 shrink-0 items-center justify-center">
      {isStill ? null : (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={SPINNER_LEAVES}
        >
          <Spinner size="sm" label={say('common.working')} />
        </motion.span>
      )}

      <span className="valence-draw relative flex">
        <Icon of={CircleCheckIcon} size={16} />
      </span>
    </span>
  );
};

DoneMark.displayName = 'DoneMark';

export { DoneMark };
