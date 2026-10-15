import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { useAnnouncement } from '@ValenceClient/announcements/useAnnouncement';
import type { CalloutTone } from '@ValenceUI/Callout.types';
import type { AnnouncementSeverity } from '@ValenceContracts/schemas/Announcement';
import { say } from '@ValenceI18n/say';

const TONES: Readonly<Record<AnnouncementSeverity, CalloutTone>> = {
  info: 'quiet',
  warning: 'warning',
  critical: 'danger',
};

/**
 * The announcement an administrator has up for everybody, held over whatever is on screen, a film
 * playing included, until it is put away or taken down. It arrives and goes the moment it is posted
 * or withdrawn, and once put away on this device it stays away until a different one is posted.
 */
const AnnouncementBanner = () => {
  const { announcement, dismiss } = useAnnouncement();
  const isStill = useReducedMotionConfig() === true;

  return (
    <AnimatePresence>
      {announcement === null ? null : (
        <motion.div
          key={announcement.id}
          initial={isStill ? { opacity: 0 } : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={isStill ? { opacity: 0 } : { opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-x-0 top-[calc(var(--valence-window-bar)+0.75rem)] z-[70] flex justify-center px-4"
        >
          <div className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--surface-line)] bg-[var(--frame-panel)] shadow-[var(--shadow-overlay)]">
            <Callout
              title={say('screens.announcementBanner.announcement')}
              tone={TONES[announcement.severity]}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={say('common.dismiss')}
                  onClick={dismiss}
                >
                  <Icon of={XIcon} size={16} />
                </Button>
              }
            >
              <span className="whitespace-pre-line">{announcement.text}</span>
            </Callout>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

AnnouncementBanner.displayName = 'AnnouncementBanner';

export { AnnouncementBanner };
