type Span = { top: number; bottom: number };

/**
 * How far a scrolling list has to move for one of its items to be wholly in view, with a margin, or
 * nothing where it already is.
 *
 * Measured from where the two are drawn rather than from an item's offset, so it holds whatever the
 * item is nested inside and however far the list has already been scrolled.
 *
 * @param box - Where the scrolling list is drawn.
 * @param item - Where the item is drawn.
 * @param margin - How much room to leave beyond the item once it is in view.
 * @returns How far to scroll, negative for upwards, or zero where nothing needs to move.
 */
const scrollDeltaToReveal = (box: Span, item: Span, margin: number): number => {
  if (item.top - margin < box.top) {
    return item.top - margin - box.top;
  }

  if (item.bottom + margin > box.bottom) {
    return item.bottom + margin - box.bottom;
  }

  return 0;
};

export type { Span };

export { scrollDeltaToReveal };
