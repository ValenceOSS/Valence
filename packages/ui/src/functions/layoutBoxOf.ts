/**
 * Where an element is laid out on the screen, leaving out any transform it or what holds it is
 * drawn with — the slide or scale a page arrives with — so it answers where the element will rest
 * rather than where it happens to be partway through arriving.
 *
 * @param element - The element.
 * @returns Its edges, in pixels from the top left of the window.
 */
const layoutBoxOf = (
  element: HTMLElement,
): { top: number; left: number; width: number; height: number } => {
  let top = 0;
  let left = 0;

  for (let at: Element | null = element; at instanceof HTMLElement; at = at.offsetParent) {
    top += at.offsetTop - (at === element ? 0 : at.scrollTop);
    left += at.offsetLeft - (at === element ? 0 : at.scrollLeft);
  }

  return {
    top: top - window.scrollY,
    left: left - window.scrollX,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
};

export { layoutBoxOf };
