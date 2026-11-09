import { Icon } from '@ValenceUI/Icon';
import { SEGMENTED } from '@ValenceUI/tokens/segmented';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import {
  Grid2x2 as Grid2x2Icon,
  Grid3x3 as Grid3x3Icon,
  Square as SquareIcon,
} from '@keyline-icons/react';
import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SlidingMark } from '@ValenceUI/SlidingMark';
import { cn } from '@ValenceUI/cn';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { GridSizeChooserProps } from './GridSizeChooser.types';
import { say } from '@ValenceI18n/say';

const SIZES: readonly {
  id: MediaGridSize;
  label: string;
  glyph: IconGlyph;
}[] = [
  { id: 'small', label: say('screens.gridSizeChooser.smallCardsMoreOfThem'), glyph: Grid3x3Icon },
  { id: 'medium', label: say('screens.gridSizeChooser.mediumCards'), glyph: Grid2x2Icon },
  { id: 'large', label: say('screens.gridSizeChooser.largeCardsFewerOfThem'), glyph: SquareIcon },
];

/**
 * Chooses how large the cards on a page are, as three presses rather than a menu — this is a setting
 * somebody adjusts by looking, and a menu makes that two presses each way while covering the thing
 * being judged. Carries the dock's travelling mark, since the three sit close enough that a
 * highlight which jumps reads as a flicker.
 *
 * @param value - The size in force.
 * @param onValueChange - Told which size was chosen.
 * @param look - Whether it sits in the solid track the other segmented controls use, or is joined
 *   like the toggles it stands beside in a panel's heading.
 * @param className - Extra classes for the caller's own layout.
 */
const GridSizeChooser = ({
  value,
  onValueChange,
  look = 'track',
  className,
}: GridSizeChooserProps) => {
  const isJoined = look === 'joined';
  const [pointedAt, setPointedAt] = useState<MediaGridSize | null>(null);

  const lit = pointedAt ?? value;

  return (
    <div
      role="group"
      aria-label={say('screens.gridSizeChooser.howLargeTheCardsAre')}
      onPointerLeave={() => {
        setPointedAt(null);
      }}
      onBlur={() => {
        setPointedAt(null);
      }}
      className={cn(
        isJoined
          ? cn(JOINED_LOOKS.track, 'relative isolate')
          : cn('flex h-8 items-center gap-0.5 rounded-md p-0.5', SEGMENTED.tones.inverted.track),
        className,
      )}
    >
      {SIZES.map(({ id, label, glyph }) => (
        <Button
          key={id}
          isIconOnly
          variant="bare"
          size="none"
          isActive={value === id}
          label={label}
          onPointerEnter={() => {
            setPointedAt(id);
          }}
          onFocus={() => {
            setPointedAt(id);
          }}
          onClick={() => {
            onValueChange(id);
          }}
          className={cn(
            isJoined
              ? 'relative flex h-[calc(2rem-2px)] w-[2.125rem] items-center justify-center'
              : 'relative flex size-7 items-center justify-center rounded-[5px]',
            'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-soft)]',
            lit === id ? 'text-text' : 'text-text-muted',
          )}
        >
          {lit === id ? (
            <SlidingMark
              group={isJoined ? 'grid-size-joined-mark' : 'grid-size-mark'}
              className={isJoined ? 'rounded-none' : 'rounded-[5px]'}
            />
          ) : null}

          <Icon of={glyph} size={16} />
        </Button>
      ))}
    </div>
  );
};

GridSizeChooser.displayName = 'GridSizeChooser';

export { GridSizeChooser };
