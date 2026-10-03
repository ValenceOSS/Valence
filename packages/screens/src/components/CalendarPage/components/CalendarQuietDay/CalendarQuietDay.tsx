import { motion } from 'motion/react';
import { say } from '@ValenceI18n/say';

/**
 * Says that nothing is released on a day of the release calendar, quietly in the middle of it, so
 * an empty day reads as checked rather than as not yet loaded.
 */
const CalendarQuietDay = () => (
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="m-auto px-2 text-center text-xs text-text-muted"
  >
    {say('common.noReleases')}
  </motion.p>
);

CalendarQuietDay.displayName = 'CalendarQuietDay';

export { CalendarQuietDay };
