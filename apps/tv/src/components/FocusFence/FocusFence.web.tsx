import { useEffect } from 'react';
import { View } from 'react-native';
import { guideRules } from '@ValenceTv/focus/guideRules';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';
import type { FocusFenceProps } from './FocusFence.types';

/**
 * Keeps the remote out of what it holds while shut, for a television's browser: a plain view the
 * web focus engine leaves alone while it is shut, and moves the remote out of if it was inside.
 *
 * @param isShut - Whether the remote is kept out.
 * @param style - How it is laid out.
 * @param children - What is fenced.
 */
const FocusFence = ({ isShut, style, children }: FocusFenceProps) => {
  const [element, drawn] = useDrawnElement();

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

    const holding = element.ownerDocument.activeElement;

    if (isShut && holding instanceof HTMLElement && element.contains(holding)) {
      holding.blur();
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
