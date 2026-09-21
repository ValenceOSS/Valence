type PageFlip = {
  isAdvancing: boolean;
  isRightToLeft: boolean;
};

const SWING_DEGREES = 100;

const SHADED = 'brightness(0.55)';

const LIT = 'brightness(1)';

/**
 * Which way a page swings, and from where: a book read left to right is hinged at its left and a
 * page turned on swings over to the left, and one read right to left is the mirror of it.
 *
 * @param flip - Which way the reader is going, and which way the book is read.
 * @returns How far the page swings, in degrees, and the edge it is hinged at.
 */
const swingOf = (flip: PageFlip): { angle: number; hinge: 'left center' | 'right center' } =>
  flip.isRightToLeft
    ? { angle: SWING_DEGREES, hinge: 'right center' }
    : { angle: -SWING_DEGREES, hinge: 'left center' };

const pageFlipVariants = {
  enter: (flip: PageFlip) =>
    flip.isAdvancing
      ? { rotateY: 0, zIndex: 1, filter: LIT }
      : { rotateY: swingOf(flip).angle, zIndex: 2, filter: SHADED },
  settled: (flip: PageFlip) => ({ rotateY: 0, zIndex: flip.isAdvancing ? 1 : 2, filter: LIT }),
  leave: (flip: PageFlip) =>
    flip.isAdvancing
      ? { rotateY: swingOf(flip).angle, zIndex: 2, filter: SHADED }
      : { rotateY: 0, zIndex: 1, filter: LIT },
};

export type { PageFlip };

export { SWING_DEGREES, pageFlipVariants, swingOf };
