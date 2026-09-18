const ROOM = '--music-bar-room';

/**
 * Tells the page how much room the player bar takes along the foot of the screen, and keeps it
 * told as the bar grows or shrinks — a band saying which device is playing, or a listening party,
 * makes it taller. A page that fills the screen above the bar leaves exactly that much room, so the
 * gap above the bar is the same as every other gap around it rather than a guess at its height.
 *
 * @param bar - The bar, including the space beneath it.
 * @returns A way to stop, which takes the room back.
 */
const keepBarRoom = (bar: HTMLElement): (() => void) => {
  const page = document.documentElement;

  const measure = () => {
    page.style.setProperty(ROOM, `${bar.offsetHeight.toString()}px`);
  };

  measure();

  const watching = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;

  watching?.observe(bar);

  return () => {
    watching?.disconnect();
    page.style.removeProperty(ROOM);
  };
};

export { keepBarRoom };
