import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotionConfig } from 'motion/react';
import { Cursor as CursorIcon, CursorClick as CursorClickIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { hasFinePointer } from '@ValenceUI/hasFinePointer';
import { POINTER_LOOK } from './POINTER_LOOK';

const HIDES_THE_SYSTEM_POINTER = 'valence-cursor-none';

/**
 * The page's own pointer, drawn in place of the system one wherever a mouse is used: the same arrow
 * the scenes on the page are acted out with, sitting exactly where the real pointer is, pressing in
 * while the button is held, and popping in when the mouse comes onto the page and away when it
 * leaves. It is drawn straight onto the page's body, over the menus that open there too. Touch
 * screens and pens keep what they have.
 */
const SiteCursor = () => {
  const isStill = useReducedMotionConfig() === true;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isShown, setIsShown] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    if (!hasFinePointer()) {
      return;
    }

    const root = document.documentElement;

    const follow = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return;
      }

      x.set(event.clientX);
      y.set(event.clientY);
      setIsShown(true);
    };

    const leave = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        setIsShown(false);
      }
    };

    const press = () => {
      setIsPressing(true);
    };

    const release = () => {
      setIsPressing(false);
    };

    const tabAway = () => {
      if (document.visibilityState === 'hidden') {
        setIsShown(false);
      }
    };

    root.classList.add(HIDES_THE_SYSTEM_POINTER);
    window.addEventListener('pointermove', follow, { passive: true });
    window.addEventListener('pointerout', leave, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('visibilitychange', tabAway);

    return () => {
      root.classList.remove(HIDES_THE_SYSTEM_POINTER);
      window.removeEventListener('pointermove', follow);
      window.removeEventListener('pointerout', leave);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      document.removeEventListener('visibilitychange', tabAway);
    };
  }, [x, y]);

  return createPortal(
    <AnimatePresence>
      {isShown ? (
        <motion.span
          aria-hidden
          style={{ x, y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: isPressing ? 0.88 : 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={isStill ? { duration: 0 } : { type: 'spring', stiffness: 600, damping: 30 }}
          className={cn(
            'pointer-events-none fixed left-0 top-0 z-[1000] origin-top-left',
            POINTER_LOOK,
          )}
        >
          <Icon of={isPressing ? CursorClickIcon : CursorIcon} size={20} />
        </motion.span>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

SiteCursor.displayName = 'SiteCursor';

export { SiteCursor };
