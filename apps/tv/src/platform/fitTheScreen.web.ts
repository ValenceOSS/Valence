import { fittedTo } from '@ValenceTv/platform/fittedTo';
import type { fitTheScreen as onTheTelevision } from '@ValenceTv/platform/fitTheScreen';

/**
 * Fits the TV layout to a television's browser, as an Android TV's screen is made 1920 points
 * across: the page is laid out 1920 points wide and scaled to fill the window, and fitted again
 * whenever the window changes, so it is the same size on a 1080p set, on a 4K set whose browser
 * says it is 3840 wide, and on one that says 1280. Nothing scrolls the page itself; each page
 * scrolls within it.
 *
 * @param page - The page, the document's own unless a test says otherwise.
 */
const fitTheScreen: typeof onTheTelevision = (page: Document = document): void => {
  const root = page.getElementById('root');
  const view = page.defaultView;

  if (root === null || view === null) {
    return;
  }

  const fit = (): void => {
    const screen = fittedTo(view.innerWidth, view.innerHeight);

    root.style.width = `${screen.width}px`;
    root.style.height = `${screen.height}px`;
    root.style.transform = `scale(${screen.scale})`;
    root.style.transformOrigin = '0 0';
  };

  page.documentElement.style.overflow = 'hidden';
  page.body.style.overflow = 'hidden';
  fit();
  view.addEventListener('resize', fit);
};

export { fitTheScreen };
