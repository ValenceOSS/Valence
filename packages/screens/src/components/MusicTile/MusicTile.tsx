import { PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { MusicTileProps } from './MusicTile.types';

const LIFTS = [
  'relative rounded-md shadow-[var(--shadow-lifted)]',
  'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  'hover-hover:group-hover/tile:-translate-y-1 group-active/tile:scale-[0.98]',
  'motion-reduce:transition-none motion-reduce:hover-hover:group-hover/tile:translate-y-0',
].join(' ');

const PLAY = [
  'absolute right-2 bottom-2 z-10 flex size-11 items-center justify-center shadow-lg',
  'translate-y-1 opacity-0 transition-[opacity,translate] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  'hover-hover:group-hover/tile:translate-y-0 hover-hover:group-hover/tile:opacity-100',
  'focus-visible:translate-y-0 focus-visible:opacity-100 motion-reduce:transition-none',
].join(' ');

/**
 * One album, artist or playlist in a rail or a grid: its picture, what it is called, and a line
 * beneath saying whose it is or how much is in it.
 *
 * The picture lifts towards the pointer and gives slightly under a press, the way the film cards
 * do, and a play button rises out of its corner for anybody who wants to start it without opening
 * it. The whole tile opens it; the play button only plays. Nothing moves on a touch screen, where
 * a hover is only ever the start of a tap.
 *
 * @param title - What it is called.
 * @param detail - The line beneath.
 * @param artwork - Its picture.
 * @param onOpen - Opens it.
 * @param onPlay - Plays it, where it can be played from here.
 */
const MusicTile = ({ title, detail, artwork, onOpen, onPlay }: MusicTileProps) => (
  <div className="group/tile relative flex min-w-0 flex-col gap-3">
    <div className={LIFTS}>
      {artwork}

      {onPlay === undefined ? null : (
        <Button
          variant="glossy"
          size="none"
          isIconOnly
          label={`Play ${title}`}
          hasTooltip={false}
          className={PLAY}
          onClick={onPlay}
        >
          <Icon of={PlayIcon} size={18} isActive />
        </Button>
      )}
    </div>

    <Button
      variant="bare"
      size="none"
      hasTooltip={false}
      className="flex min-w-0 flex-col items-start gap-0.5 text-left after:absolute after:inset-0 after:content-['']"
      onClick={onOpen}
    >
      <span className="w-full truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-text">
        {title}
      </span>
      <span className="w-full truncate text-[0.8125rem] text-text-muted">{detail}</span>
    </Button>
  </div>
);

MusicTile.displayName = 'MusicTile';

export { MusicTile };
