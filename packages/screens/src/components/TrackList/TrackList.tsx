import { AudioWave01Icon, FavouriteIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { TrackMenu } from '@ValenceScreens/components/TrackMenu/TrackMenu';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { TrackListProps } from './TrackList.types';

/**
 * Songs in a list, one to a row: where it sits, what it is and who it is by, the album it is from,
 * whether you like it, how long it is, and everything else to do with it behind a menu.
 *
 * The song playing is drawn in the accent colour with a wave where its number was, so it can be
 * found in a long list at a glance. Pressing a song's title plays the list from that song, which is
 * what anybody pressing it in the middle of an album means. Every artist named links to their page.
 *
 * @param label - What the list is, for anybody not looking at it.
 * @param tracks - The songs, in the order they play.
 * @param onPlay - Plays the list from a song.
 * @param showsAlbum - Whether to name each song's album, which an album's own page does not need.
 * @param showsArtwork - Whether to draw each song's cover beside it.
 * @param numbering - Each song's number on its album, or where it sits in this list.
 * @param onRemove - Takes a song out, where this is a playlist of yours.
 * @param onMove - Moves a song one place up or down, where this is a playlist of yours.
 */
const TrackList = ({
  label,
  tracks,
  onPlay,
  showsAlbum = true,
  showsArtwork = false,
  numbering = 'position',
  onRemove,
  onMove,
}: TrackListProps) => {
  const { state } = useMusicPlayer();
  const { open } = useMusicNavigation();
  const favourites = useFavourites(useWatchingProfile());
  const playingId = state.current?.id ?? null;

  return (
    <ol aria-label={label} className="flex flex-col">
      {tracks.map((track, index) => {
        const isCurrent = track.id === playingId;
        const isLiked = favourites.isKept(track.id);
        const number = numbering === 'track' ? (track.trackNumber ?? index + 1) : index + 1;

        return (
          <li
            key={`${track.id}-${index.toString()}`}
            className={cn(
              'group grid items-center gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-hover',
              showsAlbum
                ? 'grid-cols-[2rem_minmax(0,1fr)_auto_3rem_auto] md:grid-cols-[2rem_minmax(0,1.4fr)_minmax(0,1fr)_auto_3rem_auto]'
                : 'grid-cols-[2rem_minmax(0,1fr)_auto_3rem_auto]',
            )}
            onDoubleClick={() => {
              onPlay(index);
            }}
          >
            <span className="relative flex size-8 items-center justify-center text-sm tabular-nums text-text-muted">
              <span
                className={cn(
                  'group-hover:opacity-0 group-focus-within:opacity-0',
                  isCurrent ? 'text-accent' : '',
                )}
              >
                {isCurrent && state.isPlaying ? (
                  <Icon of={AudioWave01Icon} size={16} />
                ) : (
                  number.toString()
                )}
              </span>

              <Button
                variant="bare"
                size="none"
                isIconOnly
                label={`Play ${track.title}`}
                hasTooltip={false}
                className="absolute inset-0 flex items-center justify-center text-text opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => {
                  onPlay(index);
                }}
              >
                <Icon of={PlayIcon} size={16} />
              </Button>
            </span>

            <span className="flex min-w-0 items-center gap-3">
              {showsArtwork ? (
                <MusicArtwork
                  src={track.album.hasArtwork ? albumArtworkUrl(track.album.id) : null}
                  label={track.album.title}
                  className="size-10"
                />
              ) : null}

              <span className="flex min-w-0 flex-col">
                <Button
                  variant="bare"
                  size="none"
                  hasTooltip={false}
                  className={cn(
                    'truncate text-left text-[0.9375rem] font-medium',
                    isCurrent ? 'text-accent' : 'text-text',
                  )}
                  onClick={() => {
                    onPlay(index);
                  }}
                >
                  {track.title}
                </Button>

                <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-[0.8125rem] text-text-muted">
                  {track.isLossless ? (
                    <span className="mr-1 rounded-xs bg-hover px-1 text-[0.625rem] font-semibold uppercase tracking-wide">
                      Lossless
                    </span>
                  ) : null}

                  {track.artists.map((artist, at) => (
                    <span key={artist.id} className="truncate">
                      <Button
                        variant="link"
                        size="none"
                        hasTooltip={false}
                        className="text-text-muted hover:text-text"
                        onClick={() => {
                          open({ kind: 'artist', id: artist.id });
                        }}
                      >
                        {artist.name}
                      </Button>
                      {at < track.artists.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </span>
              </span>
            </span>

            {showsAlbum ? (
              <span className="hidden min-w-0 truncate text-[0.8125rem] text-text-muted md:block">
                <Button
                  variant="link"
                  size="none"
                  hasTooltip={false}
                  className="truncate text-text-muted hover:text-text"
                  onClick={() => {
                    open({ kind: 'album', id: track.album.id });
                  }}
                >
                  {track.album.title}
                </Button>
              </span>
            ) : null}

            <Button
              variant="bare"
              size="none"
              isIconOnly
              isActive={isLiked}
              label={isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
              hasTooltip={false}
              className={cn(
                'transition-opacity',
                isLiked
                  ? 'text-accent'
                  : 'text-text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              )}
              onClick={() => {
                favourites.toggle(track.id);
              }}
            >
              <Icon of={FavouriteIcon} size={16} isActive={isLiked} />
            </Button>

            <span className="text-right text-sm tabular-nums text-text-muted">
              {formatDuration(track.durationSeconds)}
            </span>

            <TrackMenu
              track={track}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              {...(onRemove === undefined
                ? {}
                : {
                    onRemove: () => {
                      onRemove(index);
                    },
                  })}
              {...(onMove === undefined || index === 0
                ? {}
                : {
                    onMoveUp: () => {
                      onMove(index, 'up');
                    },
                  })}
              {...(onMove === undefined || index === tracks.length - 1
                ? {}
                : {
                    onMoveDown: () => {
                      onMove(index, 'down');
                    },
                  })}
            />
          </li>
        );
      })}
    </ol>
  );
};

TrackList.displayName = 'TrackList';

export { TrackList };
