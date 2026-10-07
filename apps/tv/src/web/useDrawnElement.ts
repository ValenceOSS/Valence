import { useCallback, useState } from 'react';
import type { View } from 'react-native';

/**
 * The page element a view is drawn as in a television's browser, for what React Native cannot say
 * about it, such as a mask or a focus rule: handed back once the view is drawn, and nothing before.
 *
 * @returns The element, or nothing yet, and the ref to hand the view.
 */
const useDrawnElement = (): [HTMLElement | null, (view: View | null) => void] => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const drawn = useCallback((view: View | null) => {
    setElement(view instanceof HTMLElement ? view : null);
  }, []);

  return [element, drawn];
};

export { useDrawnElement };
