import { Orb } from '@ValenceUI/Orb';
import { cn } from '@ValenceUI/cn';
import type { MockFaceProps } from './MockFace.types';

/**
 * Somebody's face as the app draws it: a moving orb they chose, or their initial on a colour of
 * their own, in the same round frame.
 *
 * @param name - Whose face it is.
 * @param tone - The classes that colour an initial.
 * @param orb - The orb they chose, where they chose one.
 * @param className - Extra classes for the caller's own layout.
 */
const MockFace = ({ name, tone = 'bg-accent', orb, className }: MockFaceProps) => (
  <span
    className={cn(
      'flex items-center justify-center overflow-hidden rounded-full bg-subtle font-semibold text-letter-light',
      orb === undefined ? tone : '',
      className,
    )}
  >
    {orb === undefined ? name.slice(0, 1) : <Orb variant={orb} isStill className="h-full w-full" />}
  </span>
);

MockFace.displayName = 'MockFace';

export { MockFace };
