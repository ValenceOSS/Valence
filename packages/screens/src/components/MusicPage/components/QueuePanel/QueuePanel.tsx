import { ListOrdered as ListOrderedIcon, X as XIcon } from '@keyline-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Reorder } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { NothingHere } from '@ValenceUI/NothingHere';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import { say } from '@ValenceI18n/say';

/**
 * One song in the queue: its cover, its name and who it is by.
 *
 * @param props - The song, and whether it is the one playing.
 * @param props.track - The song.
 * @param props.isCurrent - Whether it is playing.
 * @returns The row's contents.
 */
const QueuedSong = ({ track, isCurrent }: { track: MusicTrack; isCurrent: boolean }) => (
  <span className="flex min-w-0 items-center gap-3">
    <MusicArtwork
      src={track.album.hasArtwork ? albumArtworkUrl(track.album.id) : null}
      label={track.album.title}
      className="size-10"
    />
    <span className="flex min-w-0 flex-col text-left">
      <span
        className={`truncate text-sm ${isCurrent ? 'font-semibold text-text' : 'font-medium text-text'}`}
      >
        {track.title}
      </span>
      <span className="truncate text-xs text-text-muted">
        {track.artists.map((artist) => artist.name).join(', ')}
      </span>
    </span>
  </span>
);

QueuedSong.displayName = 'QueuedSong';

/**
 * What is playing and what plays after it, in the order it will play — shuffled order where the
 * queue is shuffled. Pressing a song further down plays it now; the cross beside one takes it out,
 * and dragging one to another place changes the order it plays in.
 */
const QueuePanel = () => {
  const { state, player } = useMusicPlayer();
  const { queue, current } = state;
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const upcoming = queue === null ? [] : upcomingIn(queue);
  const places = upcoming.map((entry) => entry.at);
  const placesKey = places.join(',');
  const [order, setOrder] = useState<number[]>(places);
  const draggedRef = useRef<number | null>(null);

  useEffect(() => {
    setOrder(placesKey === '' ? [] : placesKey.split(',').map(Number));
  }, [placesKey]);

  if (queue === null || current === null) {
    return (
      <NothingHere
        of={ListOrderedIcon}
        title={say('screens.queuePanel.emptyTitle')}
        detail={say('screens.queuePanel.emptyDetail')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-label={say('screens.queuePanel.nowPlaying')} className="flex flex-col gap-2">
        <h3 className="px-2 text-sm font-semibold text-text">
          {say('screens.queuePanel.nowPlaying')}
        </h3>
        <div className="rounded-md px-2 py-1.5">
          <QueuedSong track={current} isCurrent />
        </div>
      </section>

      <section aria-label={say('screens.queuePanel.nextUp')} className="flex flex-col gap-2">
        <h3 className="px-2 text-sm font-semibold text-text">
          {queue.source === null
            ? say('screens.queuePanel.nextUp')
            : say('screens.queuePanel.nextFrom', { name: queue.source.name })}
        </h3>

        {upcoming.length === 0 ? (
          <p className="px-2 text-sm text-text-muted">
            {queue.repeat === 'all'
              ? say('screens.queuePanel.startsAgain')
              : say('screens.queuePanel.nothingAfter')}
          </p>
        ) : (
          <div
            ref={containerRef}
            className="relative"
            onPointerMove={follow}
            onPointerLeave={clear}
          >
            <HoverHighlight rect={rect} radius="md" />

            <Reorder.Group
              as="ol"
              axis="y"
              values={order}
              onReorder={setOrder}
              className="relative flex flex-col"
            >
              {order.map((at) => {
                const track = upcoming.find((entry) => entry.at === at)?.track;

                if (track === undefined) {
                  return null;
                }

                return (
                  <Reorder.Item
                    key={at}
                    as="li"
                    value={at}
                    data-highlight
                    className="group flex cursor-grab items-center justify-between gap-2 rounded-md px-2 py-1.5 active:cursor-grabbing"
                    onDragStart={() => {
                      draggedRef.current = at;
                    }}
                    onDragEnd={() => {
                      const from = draggedRef.current;

                      draggedRef.current = null;

                      if (from === null) {
                        return;
                      }

                      player.moveInQueue(from, queue.at + 1 + order.indexOf(from));
                    }}
                  >
                    <Button
                      variant="bare"
                      size="none"
                      label={say('screens.queuePanel.playNow', { title: track.title })}
                      hasTooltip={false}
                      className="min-w-0 flex-1"
                      onClick={() => {
                        player.jumpTo(at);
                      }}
                    >
                      <QueuedSong track={track} isCurrent={false} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      isIconOnly
                      label={say('screens.queuePanel.remove', { title: track.title })}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => {
                        player.removeFromQueue(at);
                      }}
                    >
                      <Icon of={XIcon} size={14} />
                    </Button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        )}
      </section>
    </div>
  );
};

QueuePanel.displayName = 'QueuePanel';

export { QueuePanel };
