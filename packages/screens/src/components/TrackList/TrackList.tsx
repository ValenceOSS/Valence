import { useEffect, useRef, useState } from 'react';
import { Reorder } from 'motion/react';
import { FavouriteIcon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { ExplicitMark } from '@ValenceScreens/components/ExplicitMark/ExplicitMark';
import { Equaliser } from '@ValenceScreens/components/Equaliser/Equaliser';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { TrackMenu } from '@ValenceScreens/components/TrackMenu/TrackMenu';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { TrackListProps } from './TrackList.types';

/**
 * Songs in a list, one to a row: where it sits, what it is and who it is by, the album it is from,
 * whether you like it, how long it is, and everything else to do with it behind a menu.
 *
 * One background follows the pointer from row to row, as it does down a table. The song playing is
 * drawn in bold, with moving bars where its number was, so it can be found in a long list at a
 * glance, and pointing at it offers to pause it rather than to start it again.
 * Pressing a song's title plays the list from that song, which is what anybody pressing it in the
 * middle of an album means. Every artist named links to their page.
 *
 * @param label - What the list is, for anybody not looking at it.
 * @param tracks - The songs, in the order they play.
 * @param onPlay - Plays the list from a song.
 * @param showsAlbum - Whether to name each song's album, which an album's own page does not need.
 * @param showsArtwork - Whether to draw each song's cover beside it.
 * @param numbering - Each song's number on its album, or where it sits in this list.
 * @param onRemove - Takes a song out, where this is a playlist of yours.
 * @param onMove - Moves a song one place up or down, where this is a playlist of yours.
 * @param onReorder - Told a song was dragged from one place to another, where this is a playlist of
 *   yours; the rows can only be dragged where it is given.
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
  onReorder,
}: TrackListProps) => {
  const { state, player } = useMusicPlayer();
  const { open } = useMusicNavigation();
  const favourites = useFavourites(useWatchingProfile());
  const playingId = state.current?.id ?? null;
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const [order, setOrder] = useState<number[]>(() => tracks.map((_, index) => index));
  const draggedRef = useRef<number | null>(null);

  const tracksKey = tracks.map((track) => track.id).join(',');

  useEffect(() => {
    setOrder(tracksKey === '' ? [] : tracksKey.split(',').map((_, index) => index));
  }, [tracksKey]);

  return (
    <div ref={containerRef} className="relative" onPointerMove={follow} onPointerLeave={clear}>
      <HoverHighlight rect={rect} radius="md" className="bg-[var(--surface-hover)]" />

      <Reorder.Group
        as="ol"
        axis="y"
        aria-label={label}
        values={order}
        onReorder={setOrder}
        className="flex flex-col"
      >
        {order.map((index) => {
          const track = tracks[index];

          if (track === undefined) {
            return null;
          }

          const position = order.indexOf(index);
          const isCurrent = track.id === playingId;
          const isLiked = favourites.isKept(track.id);
          const number = numbering === 'track' ? (track.trackNumber ?? position + 1) : position + 1;

          return (
            <Reorder.Item
              key={index}
              as="li"
              value={index}
              dragListener={onReorder !== undefined}
              data-highlight
              onDragStart={() => {
                draggedRef.current = index;
              }}
              onDragEnd={() => {
                const from = draggedRef.current;

                draggedRef.current = null;

                if (from !== null && onReorder !== undefined) {
                  onReorder(from, order.indexOf(from));
                }
              }}
              className={cn(
                'group relative grid items-center gap-3 rounded-md px-3 py-1.5',
                onReorder === undefined ? '' : 'cursor-grab active:cursor-grabbing',
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
                    'group-hover:opacity-0 group-has-[:focus-visible]:opacity-0',
                    isCurrent ? 'text-text' : '',
                  )}
                >
                  {isCurrent && state.isPlaying ? <Equaliser label="Playing" /> : number.toString()}
                </span>

                <Button
                  variant="bare"
                  size="none"
                  isIconOnly
                  label={
                    isCurrent && state.isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
                  }
                  hasTooltip={false}
                  className="absolute inset-0 flex items-center justify-center text-text opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => {
                    if (isCurrent && state.isPlaying) {
                      player.pause();

                      return;
                    }

                    onPlay(index);
                  }}
                >
                  <Icon of={isCurrent && state.isPlaying ? PauseIcon : PlayIcon} size={16} />
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
                      'truncate text-left text-[0.9375rem]',
                      isCurrent ? 'font-bold text-text' : 'font-medium text-text',
                    )}
                    onClick={() => {
                      onPlay(index);
                    }}
                  >
                    {track.title}
                  </Button>

                  <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-[0.8125rem] text-text-muted">
                    {track.isExplicit ? <ExplicitMark className="mr-0.5" /> : null}

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
                    ? 'text-text'
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
                {...(onMove === undefined || position === 0
                  ? {}
                  : {
                      onMoveUp: () => {
                        onMove(index, 'up');
                      },
                    })}
                {...(onMove === undefined || position === tracks.length - 1
                  ? {}
                  : {
                      onMoveDown: () => {
                        onMove(index, 'down');
                      },
                    })}
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
};

TrackList.displayName = 'TrackList';

export { TrackList };
