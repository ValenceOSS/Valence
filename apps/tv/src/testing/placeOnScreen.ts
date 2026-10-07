import type { Box } from '@ValenceTv/focus/Box';

/**
 * Says where an element is drawn, for a test in a browser stand-in that lays nothing out.
 *
 * @param element - The element.
 * @param box - Where it is.
 */
const placeOnScreen = (element: Element, box: Box): void => {
  const width = box.right - box.left;
  const height = box.bottom - box.top;

  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ ...box, x: box.left, y: box.top, width, height, toJSON: () => box }),
  });
};

export { placeOnScreen };
