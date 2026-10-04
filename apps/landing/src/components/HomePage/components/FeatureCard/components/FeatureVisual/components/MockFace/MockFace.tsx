import { cn } from '@ValenceUI/cn';
import type { MockFaceProps } from './MockFace.types';

/**
 * Somebody's face as the app draws it when they have no picture: their initial on a colour of their
 * own, in a round frame.
 *
 * @param name - Whose face it is.
 * @param tone - The classes that colour it.
 * @param className - Extra classes for the caller's own layout.
 */
const MockFace = ({ name, tone = 'bg-accent', className }: MockFaceProps) => (
  <span
    className={cn(
      'flex items-center justify-center overflow-hidden rounded-full bg-subtle font-semibold text-letter-light',
      tone,
      className,
    )}
  >
    {name.slice(0, 1)}
  </span>
);

MockFace.displayName = 'MockFace';

export { MockFace };
