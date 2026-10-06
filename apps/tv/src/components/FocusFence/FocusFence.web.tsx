import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { guideRules } from '@ValenceTv/focus/guideRules';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';
import type { FocusFenceProps } from './FocusFence.types';

/**
 * Keeps the remote out of what it holds while shut, for a television's browser: a plain view the
 * web focus engine leaves alone while it is shut, and moves the remote out of if it was inside.
 *
 * Opened again with the remote nowhere — the page that covered it gone, and what had the remote with
 * it — it hands the remote back to whatever last had it inside, as a television's own focus engine
 * does, without scrolling, so going back finds the page as it was left.
 *
 * @param isShut - Whether the remote is kept out.
 * @param style - How it is laid out.
 * @param children - What is fenced.
 */
const FocusFence = ({ isShut, style, children }: FocusFenceProps) => {
  const [element, drawn] = useDrawnElement();
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (element === null) {
      return undefined;
    }

    const keep = (event: FocusEvent): void => {
      if (event.target instanceof HTMLElement) {
        lastFocused.current = event.target;
      }
    };

    element.addEventListener('focusin', keep);

    return () => {
      element.removeEventListener('focusin', keep);
    };
  }, [element]);

  useEffect(() => {
    if (element === null) {
      return;
    }

    guideRules.set(element, {
      isRemembering: false,
      trapped: new Set(),
      isShut,
      lastFocused: null,
    });

    const page = element.ownerDocument;
    const holding = page.activeElement;

    if (isShut && holding instanceof HTMLElement && element.contains(holding)) {
      holding.blur();
    }

    const handBack = lastFocused.current;
    const isNowhere = holding === null || holding === page.body;

    if (!isShut && isNowhere && handBack !== null && element.contains(handBack)) {
      handBack.focus({ preventScroll: true });
    }
  }, [element, isShut]);

  return (
    <View ref={drawn} style={style}>
      {children}
    </View>
  );
};

FocusFence.displayName = 'FocusFence';

export { FocusFence };
