/**
 * How far down what scrolls it a grid begins, which is how far the first row sits from the top of
 * the scroll: the page's top for the window, the panel's top for a panel.
 *
 * @param lane - The grid's own element.
 * @param scroller - The panel that scrolls it, or null for the window.
 * @returns The distance, in pixels.
 */
const scrollMarginIn = (lane: HTMLElement, scroller: HTMLElement | null): number =>
  scroller === null
    ? lane.getBoundingClientRect().top + window.scrollY
    : lane.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

export { scrollMarginIn };
