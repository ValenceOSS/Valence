import { Cancel01Icon, LeftToRightListNumberIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

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
 * queue is shuffled. Pressing a song further down plays it now; the cross beside one takes it out.
 */
const QueuePanel = () => {
  const { state, player } = useMusicPlayer();
  const { queue, current } = state;

  if (queue === null || current === null) {
    return (
      <NothingHere
        of={LeftToRightListNumberIcon}
        title="Nothing queued"
        detail="Play something and what comes next will be here."
      />
    );
  }

  const upcoming = upcomingIn(queue);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Now playing" className="flex flex-col gap-2">
        <h3 className="px-2 text-sm font-semibold text-text">Now playing</h3>
        <div className="rounded-md px-2 py-1.5">
          <QueuedSong track={current} isCurrent />
        </div>
      </section>

      <section aria-label="Next up" className="flex flex-col gap-2">
        <h3 className="px-2 text-sm font-semibold text-text">
          {queue.source === null ? 'Next up' : `Next from ${queue.source.name}`}
        </h3>

        {upcoming.length === 0 ? (
          <p className="px-2 text-sm text-text-muted">
            {queue.repeat === 'all' ? 'The queue starts again after this.' : 'Nothing after this.'}
          </p>
        ) : (
          <ol className="flex flex-col">
            {upcoming.map(({ at, track }) => (
              <li
                key={`${track.id}-${at.toString()}`}
                className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-hover"
              >
                <Button
                  variant="bare"
                  size="none"
                  label={`Play ${track.title} now`}
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
                  label={`Take ${track.title} out of the queue`}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => {
                    player.removeFromQueue(at);
                  }}
                >
                  <Icon of={Cancel01Icon} size={14} />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

QueuePanel.displayName = 'QueuePanel';

export { QueuePanel };
