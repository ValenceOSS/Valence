import type { AHomeShelfProps } from './AHomeShelf.types';

/**
 * Whether a home shelf would be drawn just as it was: the same row, or the same programmes coming
 * up, with the same things to draw it from. A row is the same row however the page wraps it, so a
 * page that puts its rows together again without changing one does not draw that one again.
 *
 * @param was - What the shelf was drawn from.
 * @param now - What it is to be drawn from.
 * @returns Whether drawing it again would draw the same thing.
 */
const isDrawnAlike = (was: AHomeShelfProps, now: AHomeShelfProps): boolean => {
  if (was.onLookAtShow !== now.onLookAtShow) {
    return false;
  }

  if (was.shelf.kind === 'comingUp' || now.shelf.kind === 'comingUp') {
    return (
      was.shelf.kind === now.shelf.kind && was.upcoming === now.upcoming && was.today === now.today
    );
  }

  return (
    was.shelf.rail === now.shelf.rail &&
    was.progress === now.progress &&
    was.flagOf === now.flagOf &&
    was.onLookAt === now.onLookAt &&
    was.onDismiss === now.onDismiss
  );
};

export { isDrawnAlike };
