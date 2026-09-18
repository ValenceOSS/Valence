import { useEffect } from 'react';

type TurnKeys = {
  isRightToLeft: boolean;
  forward: () => void;
  back: () => void;
  onClose: () => void;
};

/**
 * The keys a reader turns with, which is most of how somebody at a keyboard reads.
 *
 * The arrows follow the way the book is read: in a book read right to left, the left arrow goes on.
 * Down, space and page down always go on, and up and page up always go back, since those say where
 * somebody is going rather than which way the page lies. Escape leaves.
 *
 * @param keys - Which way the book is read, and what turning and leaving do.
 */
const useTurnKeys = ({ isRightToLeft, forward, back, onClose }: TurnKeys): void => {
  useEffect(() => {
    const pressed = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();

        return;
      }

      if (event.key === 'ArrowLeft') {
        (isRightToLeft ? forward : back)();
      }

      if (event.key === 'ArrowRight') {
        (isRightToLeft ? back : forward)();
      }

      if (event.key === 'ArrowDown' || event.key === ' ' || event.key === 'PageDown') {
        forward();
      }

      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        back();
      }
    };

    window.addEventListener('keydown', pressed);

    return () => {
      window.removeEventListener('keydown', pressed);
    };
  }, [back, forward, isRightToLeft, onClose]);
};

export { useTurnKeys };
