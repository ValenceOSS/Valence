import { directionOfKey } from '@ValenceTv/focus/directionOfKey';
import { moveFocus } from '@ValenceTv/focus/moveFocus';
import { rememberWhereFocusWent } from '@ValenceTv/focus/rememberWhereFocusWent';
import type { startFocusEngine as onTheTelevision } from '@ValenceTv/focus/startFocusEngine';

let isStarted = false;

/**
 * Whether the remote is typing in a field, where left and right move along the text instead.
 *
 * @param element - What has focus.
 * @returns Whether it is a text field.
 */
const isTyping = (element: Element | null): boolean =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

/**
 * Starts the web television's focus engine, once: the remote's pad moves focus across the page as
 * tvOS's does, rather than the browser scrolling, guides remember where the remote was, and the
 * browser's own focus outline is turned off, since the television draws its own.
 *
 * @param page - The page, the document's own unless a test says otherwise.
 */
const startFocusEngine: typeof onTheTelevision = (page: Document = document): void => {
  if (isStarted) {
    return;
  }

  isStarted = true;

  const ownFocus = page.createElement('style');

  ownFocus.textContent = '*:focus { outline: none; }';
  page.head.append(ownFocus);
  page.addEventListener('focusin', (event) => {
    rememberWhereFocusWent(event.target);
  });
  page.addEventListener('keydown', (event) => {
    const direction = directionOfKey(event.key);

    if (direction === null || event.defaultPrevented) {
      return;
    }

    if (isTyping(page.activeElement) && (direction === 'left' || direction === 'right')) {
      return;
    }

    event.preventDefault();
    moveFocus(direction, page);
  });
};

export { startFocusEngine };
