import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TruncatedText } from '@ValenceUI/TruncatedText';
import { usePagedScroller } from '@ValenceUI/usePagedScroller';
import { RowFoldButton } from '@ValenceScreens/components/AdminArea/components/RowFoldButton/RowFoldButton';
import type { SessionLaneProps } from './SessionLane.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One person's sessions, as a panel under their face and name: their cards along one row that
 * scrolls sideways, turned a page of whole cards at a time by a pair of arrows at the right of the
 * heading, and folded away under the name for a long list.
 *
 * @param name - Whose sessions they are.
 * @param face - Their picture.
 * @param count - How many sessions they have open.
 * @param size - How large the cards are, so the row is measured again when that changes.
 * @param children - The cards, each in a slot of the chosen width.
 */
const SessionLane = ({ name, face, count, size, children }: SessionLaneProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const prefersReducedMotion = useReducedMotionConfig();
  const { trackRef, pages, isAtStart, isAtEnd, measure, scrollTo } =
    usePagedScroller<HTMLDivElement>(isOpen ? count : 0);

  useEffect(() => {
    measure();
  }, [measure, size, count]);

  return (
    <section aria-label={name} className="valence-card-face flex flex-col px-2 pb-2 pt-1.5">
      <header className="flex items-center gap-2.5 px-1 pb-1 pt-1.5">
        <RowFoldButton
          label={say(
            isOpen
              ? 'screens.adminArea.sessionTable.hideTheSessionsOfName'
              : 'screens.adminArea.sessionTable.showTheSessionsOfName',
            { name },
          )}
          isOpen={isOpen}
          onToggle={() => {
            setIsOpen((was) => !was);
          }}
        />
        {face}
        <TruncatedText text={name} className="text-sm font-semibold text-text" />
        <span className="shrink-0 text-[0.78125rem] text-text-muted">
          {sayCount('common.count.sessions', count)}
        </span>

        {!isOpen || pages.count <= 1 ? null : (
          <span className="ms-auto flex shrink-0 items-center gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              isIconOnly
              label={say('screens.adminArea.sessionLane.backThroughTheSessionsOfName', { name })}
              disabled={isAtStart}
              onClick={() => {
                scrollTo(pages.at - 1);
              }}
            >
              <Icon of={ChevronLeftIcon} size={16} />
            </Button>
            <Button
              variant="secondary"
              size="xs"
              isIconOnly
              label={say('screens.adminArea.sessionLane.onThroughTheSessionsOfName', { name })}
              disabled={isAtEnd}
              onClick={() => {
                scrollTo(pages.at + 1);
              }}
            >
              <Icon of={ChevronRightIcon} size={16} />
            </Button>
          </span>
        )}
      </header>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              ref={trackRef}
              onScroll={measure}
              className="valence-rail flex gap-2 overflow-x-auto overscroll-x-contain pt-1"
            >
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

SessionLane.displayName = 'SessionLane';

export { SessionLane };
