import { useEffect, useRef } from 'react';

/**
 * Whether a key was pressed while somebody was typing, when a one-letter shortcut must not fire.
 *
 * @param target - Where the key was pressed.
 * @returns Whether it was pressed in a field or anything else that takes typing.
 */
const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Presses something from the keyboard: a single key, with no modifier held, while the page has it
 * and nobody is typing in a field or has a dialog open over it.
 *
 * @param key - The key, such as "J".
 * @param onPress - What pressing it does, or nothing where it does nothing right now.
 */
const useShortcut = (key: string, onPress: (() => void) | undefined): void => {
  const pressing = useRef(onPress);

  useEffect(() => {
    pressing.current = onPress;
  }, [onPress]);

  useEffect(() => {
    const pressed = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== key.toLowerCase() ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.defaultPrevented ||
        isTyping(event.target) ||
        document.querySelector('[role="dialog"]') !== null
      ) {
        return;
      }

      if (pressing.current !== undefined) {
        event.preventDefault();
        pressing.current();
      }
    };

    window.addEventListener('keydown', pressed);

    return () => {
      window.removeEventListener('keydown', pressed);
    };
  }, [key]);
};

export { useShortcut };
