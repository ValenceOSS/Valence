import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PageDots } from '@ValenceUI/PageDots';
import { cn } from '@ValenceUI/cn';
import type { PersonPortraitsProps } from './PersonPortraits.types';
import { say } from '@ValenceI18n/say';

/**
 * The pictures of somebody the catalogue has, one at a time, turned through with the arrows or the
 * dots. A single picture is drawn alone, with nothing to turn.
 *
 * @param portraits - Where to fetch each picture, the one they are best known by first.
 * @param className - Extra classes for the caller's own layout.
 */
const PersonPortraits = ({ portraits, className }: PersonPortraitsProps) => {
  const [at, setAt] = useState(0);
  const isStill = useReducedMotionConfig() === true;
  const count = portraits.length;
  const shownAt = count === 0 ? 0 : Math.min(at, count - 1);
  const first = portraits[0];

  useEffect(() => {
    setAt(0);
  }, [first]);

  return (
    <div className={cn('relative size-full', className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={portraits[shownAt]}
          src={portraits[shownAt]}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isStill ? 0 : 0.2, ease: 'easeOut' }}
          className="absolute inset-0 size-full object-cover"
        />
      </AnimatePresence>

      {count < 2 ? null : (
        <>
          <Button
            isIconOnly
            variant="overlay"
            size="sm"
            label={say('common.previous')}
            className="absolute inset-y-0 start-2 my-auto hover-hover:hover:scale-100 active:translate-y-0 active:scale-100"
            onClick={() => {
              setAt((shownAt - 1 + count) % count);
            }}
          >
            <Icon of={ChevronLeftIcon} size={16} />
          </Button>

          <Button
            isIconOnly
            variant="overlay"
            size="sm"
            label={say('common.next')}
            className="absolute inset-y-0 end-2 my-auto hover-hover:hover:scale-100 active:translate-y-0 active:scale-100"
            onClick={() => {
              setAt((shownAt + 1) % count);
            }}
          >
            <Icon of={ChevronRightIcon} size={16} />
          </Button>

          <PageDots
            count={count}
            selectedIndex={shownAt}
            onSelect={setAt}
            label={say('screens.personDialog.pictures')}
            tone="overlay"
            className="absolute inset-x-0 bottom-2 justify-center"
          />
        </>
      )}
    </div>
  );
};

PersonPortraits.displayName = 'PersonPortraits';

export { PersonPortraits };
