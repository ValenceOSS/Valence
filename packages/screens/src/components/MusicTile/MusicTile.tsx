import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { ContextMenu } from '@ValenceUI/ContextMenu';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { MusicTileProps } from './MusicTile.types';
import { say } from '@ValenceI18n/say';

const LIFTS = [
  'transition-[translate,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  'hover-hover:group-hover/tile:-translate-y-1 group-active/tile:scale-[0.98]',
  'motion-reduce:transition-none motion-reduce:hover-hover:group-hover/tile:translate-y-0',
].join(' ');

const PLAY = [
  'pointer-events-auto absolute end-2 bottom-2 flex size-11 items-center justify-center shadow-lg',
  'translate-y-1 opacity-0 transition-[opacity,translate] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  'hover-hover:group-hover/tile:translate-y-0 hover-hover:group-hover/tile:opacity-100',
  'focus-visible:translate-y-0 focus-visible:opacity-100 motion-reduce:transition-none',
].join(' ');

/**
 * One album, artist or playlist in a rail or a grid: its picture, what it is called, and a line
 * beneath saying whose it is or how much is in it.
 *
 * The whole tile is one button that opens it, picture and words alike. The picture lifts towards
 * the pointer and gives slightly under a press, the way the film cards do, and a play button rises
 * out of its corner — laid over the tile rather than inside it, since one button cannot hold
 * another — for anybody who wants to start it without opening it. Nothing moves on a touch
 * screen, where a hover is only ever the start of a tap.
 *
 * @param title - What it is called.
 * @param isTitleShown - Whether its name is written beneath it, which a picture that already says it
 *   leaves out, giving the line beneath two lines of its own.
 * @param detail - The line beneath.
 * @param artwork - Its picture.
 * @param onOpen - Opens it.
 * @param onPlay - Plays it, where it can be played from here.
 * @param isPlaying - Whether it is what is playing, which keeps its button up and has it pause.
 * @param onPointingAt - Told when the pointer reaches it, so what it opens can be read ahead.
 * @param menu - What can be done to it, from a menu that opens where it is right-clicked.
 * @param shape - Square for a record, round for a person, which the shadow under it follows.
 */
const MusicTile = ({
  title,
  isTitleShown = true,
  detail,
  artwork,
  onOpen,
  onPlay,
  isPlaying = false,
  onPointingAt,
  menu,
  shape = 'square',
}: MusicTileProps) => {
  const tile = (
    <div className="group/tile relative min-w-0" onPointerEnter={onPointingAt}>
      <Button
        variant="bare"
        size="none"
        hasTooltip={false}
        className="flex w-full min-w-0 flex-col items-stretch gap-3 rounded-md text-start"
        onClick={onOpen}
      >
        <span
          className={`block shadow-[var(--shadow-lifted)] ${shape === 'round' ? 'rounded-full' : 'rounded-xl'} ${LIFTS}`}
        >
          {artwork}
        </span>

        <span className="flex min-w-0 flex-col gap-0.5">
          {isTitleShown ? (
            <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-text">
              {title}
            </span>
          ) : null}
          <span
            className={
              isTitleShown
                ? 'truncate text-[0.8125rem] text-text-muted'
                : 'line-clamp-2 text-[0.875rem] leading-snug text-text-muted'
            }
          >
            {detail}
          </span>
        </span>
      </Button>

      {onPlay === undefined ? null : (
        <span className={`pointer-events-none absolute inset-x-0 top-0 aspect-square ${LIFTS}`}>
          <Button
            variant="confirm"
            size="none"
            isIconOnly
            label={
              isPlaying ? say('common.pauseTitle', { title }) : say('common.playTitle', { title })
            }
            hasTooltip={false}
            className={cn(PLAY, isPlaying ? 'translate-y-0 opacity-100' : '')}
            onClick={onPlay}
          >
            <Icon of={isPlaying ? PauseFilledIcon : PlayFilledIcon} size={18} />
          </Button>
        </span>
      )}
    </div>
  );

  return menu === undefined ? (
    tile
  ) : (
    <ContextMenu label={title} groups={menu}>
      {tile}
    </ContextMenu>
  );
};

MusicTile.displayName = 'MusicTile';

export { MusicTile };
