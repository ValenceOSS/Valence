import { useEffect } from 'react';
import { View } from 'react-native';
import { guideRules } from '@ValenceTv/focus/guideRules';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';
import type { Direction } from '@ValenceTv/focus/Direction';
import type { FocusGuideProps } from './FocusGuide.types';

/**
 * A part of the screen that shapes where the remote goes inside it, for a television's browser:
 * drawn as a plain view whose rules the web focus engine reads, since a browser has no focus guides.
 *
 * @param isRemembering - Whether coming back in lands on what was last landed on inside.
 * @param trapsUp - Whether pressing up stays inside.
 * @param trapsDown - Whether pressing down stays inside.
 * @param trapsLeft - Whether pressing left stays inside.
 * @param trapsRight - Whether pressing right stays inside.
 * @param onFocusInside - Told when the remote lands on anything inside.
 * @param style - How it is laid out.
 * @param children - What is inside.
 */
const FocusGuide = ({
  isRemembering = false,
  trapsUp = false,
  trapsDown = false,
  trapsLeft = false,
  trapsRight = false,
  onFocusInside,
  style,
  children,
}: FocusGuideProps) => {
  const [element, drawn] = useDrawnElement();

  useEffect(() => {
    if (element === null) {
      return;
    }

    const trapped = new Set<Direction>();

    if (trapsUp) {
      trapped.add('up');
    }

    if (trapsDown) {
      trapped.add('down');
    }

    if (trapsLeft) {
      trapped.add('left');
    }

    if (trapsRight) {
      trapped.add('right');
    }

    guideRules.set(element, {
      isRemembering,
      trapped,
      isShut: false,
      lastFocused: guideRules.get(element)?.lastFocused ?? null,
    });
  }, [element, isRemembering, trapsUp, trapsDown, trapsLeft, trapsRight]);

  useEffect(() => {
    if (element === null || onFocusInside === undefined) {
      return;
    }

    const told = () => {
      onFocusInside();
    };

    element.addEventListener('focusin', told);

    return () => {
      element.removeEventListener('focusin', told);
    };
  }, [element, onFocusInside]);

  return (
    <View ref={drawn} style={style}>
      {children}
    </View>
  );
};

FocusGuide.displayName = 'FocusGuide';

export { FocusGuide };
