import { useCallback, useEffect, useState } from 'react';
import { nextFocusOverrides } from '@ValenceTv/focus/nextFocusOverrides';
import type { Ref } from 'react';
import type { View } from 'react-native';
import type { FocusHints } from './FocusHints';
import type { useFocusHints as onTheTelevision } from '@ValenceTv/components/Focusable/hooks/useFocusHints/useFocusHints';

/**
 * Hands a ref what it is given, whichever kind of ref it is.
 *
 * @param ref - The ref.
 * @param view - What to hand it.
 */
const handTo = (ref: Ref<View> | undefined, view: View | null): void => {
  if (typeof ref === 'function') {
    ref(view);
  } else if (ref !== null && ref !== undefined) {
    ref.current = view;
  }
};

/**
 * Tells a television's browser where the remote starts and where pressing right goes from a
 * pressable element: it takes focus once it is drawn, if it wants it, and the web focus engine is
 * told where right leads.
 *
 * @param ref - Handed the element, for whatever sends the remote to it.
 * @param wantsFocus - Whether the remote should start here.
 * @param nextFocusRight - Where pressing right goes, where it should not be left to the television.
 * @returns The ref to hand the element, and no props, since the browser reads none of them.
 */
const useFocusHints: typeof onTheTelevision = (
  ref: Ref<View> | undefined,
  wantsFocus: boolean,
  nextFocusRight: View | null | undefined,
): FocusHints => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const drawn = useCallback(
    (view: View | null) => {
      handTo(ref, view);
      setElement(view instanceof HTMLElement ? view : null);
    },
    [ref],
  );

  useEffect(() => {
    if (element !== null && wantsFocus) {
      element.focus();
    }
  }, [element, wantsFocus]);

  useEffect(() => {
    if (element === null) {
      return;
    }

    if (nextFocusRight instanceof HTMLElement) {
      nextFocusOverrides.set(element, { right: nextFocusRight });
    } else {
      nextFocusOverrides.delete(element);
    }
  }, [element, nextFocusRight]);

  return { ref: drawn, hints: {} };
};

export { useFocusHints };
