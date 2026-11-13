import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { NoticeCard } from '@ValenceUI/NoticeCard';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { readChangelogSeen, saveChangelogSeen } from '@ValenceScreens/admin/changelogSeen';
import { readReleaseNotes } from '@ValenceScreens/admin/readReleaseNotes';
import type { WhatsNewInValenceProps } from './WhatsNewInValence.types';
import { say } from '@ValenceI18n/say';

const RELEASED = /^v?\d+\.\d+\.\d+$/u;

const MOST_SHOWN = 4;

/**
 * What changed in the release Valence has just updated to, said once on this device the first
 * time somebody opens the admin pages after the update: the first few changes from its notes, and a
 * way to read the rest. Only a proper release is announced, never a development or nightly build,
 * and a device that has never seen one is not told about the release it starts on, since nothing
 * has changed for it yet.
 *
 * @param onOpenUpdates - Opens the page with the release's full notes.
 */
const WhatsNewInValence = ({ onOpenUpdates }: WhatsNewInValenceProps) => {
  const check = useQuery(adminQueries.updateCheck()).data;
  const isStill = useReducedMotionConfig() === true;
  const [seen, setSeen] = useState(readChangelogSeen);
  const current = check?.current ?? null;
  const isRelease = current !== null && RELEASED.test(current) && (check?.dev ?? null) === null;

  if (isRelease && seen === null) {
    saveChangelogSeen(current);
    setSeen(current);
  }

  const bare = (version: string | null) => version?.replace(/^v/u, '') ?? null;
  const release = check?.history.find((one) => bare(one.version) === bare(current)) ?? null;
  const notes =
    release?.notes ?? (check !== undefined && check.latest === current ? check.notes : null);
  const points = (notes === null ? [] : readReleaseNotes(notes))
    .flatMap((section) => section.points)
    .slice(0, MOST_SHOWN);
  const isShown = isRelease && seen !== null && seen !== current;

  const close = () => {
    if (current !== null) {
      saveChangelogSeen(current);
      setSeen(current);
    }
  };

  return (
    <AnimatePresence>
      {!isShown ? null : (
        <motion.div
          key="whats-new"
          initial={isStill ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={isStill ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={isStill ? { duration: 0 } : { type: 'spring', bounce: 0.3, duration: 0.5 }}
          className="pointer-events-auto"
        >
          <NoticeCard
            tone="info"
            title={say('screens.adminArea.whatsNewInValence.title', {
              version: bare(current) ?? '',
            })}
            action={{
              label: say('screens.adminArea.whatsNewInValence.seeEverythingNew'),
              onPress: () => {
                close();
                onOpenUpdates();
              },
            }}
            onDismiss={close}
          >
            {points.length === 0 ? undefined : (
              <ul className="flex flex-col gap-2 text-[0.8125rem] leading-snug text-text-muted">
                {points.map((point) => (
                  <li key={point.text} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-current"
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{point.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </NoticeCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

WhatsNewInValence.displayName = 'WhatsNewInValence';

export { WhatsNewInValence };
