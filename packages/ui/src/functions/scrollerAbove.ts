/**
 * The thing actually doing the scrolling above an element, which is what its position has to be
 * judged against.
 *
 * @param from - The element to look upwards from.
 * @returns The scrolling ancestor, or the document where nothing nearer scrolls.
 */
const scrollerAbove = (from: HTMLElement): HTMLElement => {
  let above = from.parentElement;

  while (above !== null) {
    const { overflowY } = getComputedStyle(above);

    if (overflowY === 'auto' || overflowY === 'scroll') {
      return above;
    }

    above = above.parentElement;
  }

  return document.documentElement;
};

export { scrollerAbove };
