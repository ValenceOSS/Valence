/**
 * How much of the page sits below an element: at each step out towards the page, whatever of its
 * siblings starts beneath it and the padding and edge closing its parent. Siblings beside it, such
 * as a sidebar, do not count, and neither does space a parent was stretched to fill, which is room
 * rather than something sitting there.
 *
 * @param element - Where to measure from.
 * @returns The height below it, in pixels.
 */
const heldBelow = (element: HTMLElement): number => {
  let below = 0;
  let node: HTMLElement = element;

  while (node.parentElement !== null && node !== document.body) {
    const parent = node.parentElement;
    const edges = node.getBoundingClientRect();
    const own = getComputedStyle(node);
    const after = [...parent.children]
      .map((child) => child.getBoundingClientRect())
      .filter((rect) => rect.height > 0 && rect.top >= edges.bottom - 1);
    const lowest = Math.max(
      edges.bottom + (Number.parseFloat(own.marginBottom) || 0),
      ...after.map((rect) => rect.bottom),
    );
    const closing = getComputedStyle(parent);

    below +=
      lowest -
      edges.bottom +
      (Number.parseFloat(closing.paddingBottom) || 0) +
      (Number.parseFloat(closing.borderBottomWidth) || 0);
    node = parent;
  }

  return below;
};

export { heldBelow };
