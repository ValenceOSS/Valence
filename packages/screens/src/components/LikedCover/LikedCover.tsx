import { Heart as HeartFilledIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { LikedCoverProps } from './LikedCover.types';

/**
 * The cover of somebody's liked songs, which have no album to borrow one from: a heart on a plain
 * square, drawn the same wherever the list appears.
 *
 * @param iconSize - How large the heart is.
 * @param className - Its size and anything else the caller's layout needs.
 */
const LikedCover = ({ iconSize = 40, className }: LikedCoverProps) => (
  <span
    className={cn(
      'flex aspect-square w-full items-center justify-center rounded-md bg-text text-surface',
      className,
    )}
  >
    <Icon of={HeartFilledIcon} size={iconSize} />
  </span>
);

LikedCover.displayName = 'LikedCover';

export { LikedCover };
