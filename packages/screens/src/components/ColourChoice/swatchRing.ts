import { cn } from '@ValenceUI/cn';

/**
 * How a round swatch is ringed: in the accent, held apart from it, where it is the one chosen;
 * otherwise faintly in the text colour, the same way, while it is pointed at, as it grows a little.
 *
 * @param isChosen - Whether it is the one chosen.
 * @returns Its classes.
 */
const swatchRing = (isChosen: boolean): string =>
  cn(
    'ring-offset-[var(--color-surface-raised)] transition-[transform,box-shadow] duration-150 ease-out still:transition-none',
    isChosen
      ? 'ring-2 ring-primary ring-offset-2'
      : 'hover-hover:hover:scale-110 hover-hover:hover:ring-2 hover-hover:hover:ring-text/25 hover-hover:hover:ring-offset-2 still:transform-none',
  );

export { swatchRing };
