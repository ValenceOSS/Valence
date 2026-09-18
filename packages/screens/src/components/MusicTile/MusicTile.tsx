import { PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { MusicTileProps } from './MusicTile.types';

/**
 * One album, artist or playlist in a grid: its picture, its name and a line about it.
 *
 * The whole tile opens it. A play button rises out of the corner of the picture on hover, so
 * something can be put on without going to its page first — the way anybody who knows what they
 * want to hear uses a grid of records.
 *
 * @param title - Its name.
 * @param detail - A line about it: who it is by, what year, how many songs.
 * @param artwork - Its picture.
 * @param onOpen - Goes to its page.
 * @param onPlay - Plays it straight away, where it can be.
 */
const MusicTile = ({ title, detail, artwork, onOpen, onPlay }: MusicTileProps) => (
  <div className="group relative flex min-w-0 flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-hover">
    <div className="relative">
      {artwork}

      {onPlay === undefined ? null : (
        <Button
          variant="primary"
          size="none"
          isIconOnly
          label={`Play ${title}`}
          hasTooltip={false}
          className="absolute right-2 bottom-2 z-10 flex size-11 translate-y-2 items-center justify-center opacity-0 shadow-lg transition-[opacity,transform] group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
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
      <span className="w-full truncate text-[0.9375rem] font-semibold text-text">{title}</span>
      <span className="w-full truncate text-[0.8125rem] text-text-muted">{detail}</span>
    </Button>
  </div>
);

MusicTile.displayName = 'MusicTile';

export { MusicTile };
