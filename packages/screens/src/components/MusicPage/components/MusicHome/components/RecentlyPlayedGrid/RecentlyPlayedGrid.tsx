import { Heart as HeartFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { RecentlyPlayedGridProps } from './RecentlyPlayedGrid.types';
import { say } from '@ValenceI18n/say';

const TILE =
  'group/spot relative block aspect-square w-full min-w-0 overflow-hidden rounded-[1.25rem] bg-surface-raised text-left transition-[scale] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.98] motion-reduce:active:scale-100';

const NAME =
  'absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-scrim to-transparent px-3 pt-8 pb-2.5 text-sm font-semibold text-on-scrim';

const SHOWN = 3;

/**
 * The squares beside the feature on the music home: liked songs, then the albums played lately, then
 * the newest for anybody who has not played much yet, so the grid is never left holding one tile.
 *
 * @param albums - The albums played, latest first.
 * @param newest - The albums added lately, to fill what is left.
 */
const RecentlyPlayedGrid = ({ albums, newest }: RecentlyPlayedGridProps) => {
  const { open } = useMusicNavigation();
  const shown = [
    ...albums,
    ...newest.filter((album) => !albums.some(({ id }) => id === album.id)),
  ].slice(0, SHOWN);

  return (
    <section
      aria-label={say('screens.musicPage.musicHome.recentlyPlayed')}
      className="grid grid-cols-2 gap-3"
    >
      <Button
        variant="bare"
        size="none"
        hasTooltip={false}
        className={TILE}
        onClick={() => {
          open({ kind: 'liked' });
        }}
      >
        <span className="flex size-full items-center justify-center bg-text text-surface">
          <Icon of={HeartFilledIcon} size={40} />
        </span>
        <span className={NAME}>{say('common.likedSongs2')}</span>
      </Button>

      {shown.map((album) => (
        <Button
          key={album.id}
          variant="bare"
          size="none"
          hasTooltip={false}
          className={TILE}
          onClick={() => {
            open({ kind: 'album', id: album.id });
          }}
        >
          <MusicArtwork
            src={album.hasArtwork ? albumArtworkUrl(album.id) : null}
            label={album.title}
            className="w-full transition-[scale] duration-[var(--duration-base)] ease-[var(--ease-out)] hover-hover:group-hover/spot:scale-[1.04] motion-reduce:hover-hover:group-hover/spot:scale-100"
          />
          <span className={NAME}>{album.title}</span>
        </Button>
      ))}
    </section>
  );
};

RecentlyPlayedGrid.displayName = 'RecentlyPlayedGrid';

export { RecentlyPlayedGrid };
