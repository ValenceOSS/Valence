import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Album02Icon, Mic01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { albumArtworkUrl, fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import type { MusicFeatureProps } from './MusicFeature.types';

const UP_NEXT_SHOWN = 4;

const SETTLING = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

/**
 * The top of the music section: whatever is playing, large, with what comes after it beside it —
 * or, when nothing is, the newest record in the library, ready to start.
 *
 * It lights the room in the colours of its cover. When the song changes the feature dissolves
 * into the next one through a moment of blur rather than cutting, so the page keeps time with the
 * music without jumping.
 *
 * @param newest - The album most recently added, for when nothing is playing.
 * @param player - The player to show, which is the window's own unless a test says otherwise.
 */
const MusicFeature = ({ newest, player: given }: MusicFeatureProps) => {
  const { state, player } = useMusicPlayer(given ?? theMusicPlayer());
  const { open } = useMusicNavigation();
  const prefersReducedMotion = useReducedMotionConfig();
  const song = state.current;
  const album = song?.album ?? newest;
  const cover = album !== null && album.hasArtwork ? albumArtworkUrl(album.id) : null;
  const upNext = state.queue === null ? [] : upcomingIn(state.queue).slice(0, UP_NEXT_SHOWN);
  const rises = revealVariants(prefersReducedMotion);
  const moves = revealTransition(prefersReducedMotion);

  useLightTheMusic(cover);

  if (album === null) {
    return null;
  }

  const dissolves =
    prefersReducedMotion === true
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, filter: 'blur(8px)' },
          animate: { opacity: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, filter: 'blur(8px)' },
        };

  return (
    <section
      aria-label={song === null ? 'Newest in your library' : 'Now playing'}
      className={`relative grid items-end gap-8 pt-6 pb-4 lg:grid-cols-[minmax(0,1fr)_20rem] ${MUSIC_LANES.page}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={song?.id ?? album.id}
          {...dissolves}
          transition={SETTLING}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8"
        >
          <div className="w-48 shrink-0 shadow-[var(--shadow-overlay)] sm:w-60 lg:w-72">
            <MusicArtwork src={cover} label={album.title} className="w-full" />
          </div>

          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate="shown"
            className="flex min-w-0 flex-col gap-3"
          >
            <motion.span
              variants={rises}
              transition={moves}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted"
            >
              {song === null
                ? 'Newest in your library'
                : state.isPlaying
                  ? 'Now playing'
                  : 'Paused'}
            </motion.span>

            <motion.h2
              variants={rises}
              transition={moves}
              className="break-words text-[clamp(2rem,4.5vw,4.25rem)] font-bold leading-[0.95] tracking-[-0.035em] text-balance text-text"
            >
              {song?.title ?? album.title}
            </motion.h2>

            <motion.p variants={rises} transition={moves} className="text-sm text-text-muted">
              {song === null
                ? newest?.artist.name
                : `${song.artists.map((artist) => artist.name).join(', ')} · ${song.album.title}`}
            </motion.p>

            <motion.div
              variants={rises}
              transition={moves}
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              <Button
                variant="glossy"
                size="lg"
                onClick={() => {
                  if (song !== null) {
                    player.toggle();

                    return;
                  }

                  void fetchAlbum(album.id).then((read) => {
                    player.play(read.tracks, 0, {
                      source: { kind: 'album', id: album.id, name: album.title },
                    });
                  });
                }}
              >
                <Icon
                  of={song !== null && state.isPlaying ? PauseIcon : PlayIcon}
                  size={18}
                  isActive
                />
                {song === null ? 'Play' : state.isPlaying ? 'Pause' : 'Resume'}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  open({ kind: 'album', id: album.id });
                }}
              >
                <Icon of={Album02Icon} size={18} />
                Open album
              </Button>

              {song?.hasLyrics === true ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    open({ kind: 'lyrics' });
                  }}
                >
                  <Icon of={Mic01Icon} size={18} />
                  Lyrics
                </Button>
              ) : null}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {upNext.length === 0 ? null : (
        <section aria-label="Up next" className="hidden flex-col gap-2 lg:flex">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Up next
          </h3>
          <ol className="flex flex-col">
            {upNext.map(({ at, track }) => (
              <li key={`${track.id}-${at.toString()}`}>
                <Button
                  variant="bare"
                  size="none"
                  hasTooltip={false}
                  label={`Play ${track.title} now`}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-hover)]"
                  onClick={() => {
                    player.jumpTo(at);
                  }}
                >
                  <MusicArtwork
                    src={track.album.hasArtwork ? albumArtworkUrl(track.album.id) : null}
                    label={track.album.title}
                    className="size-10"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-text">{track.title}</span>
                    <span className="truncate text-xs text-text-muted">
                      {track.artists.map((artist) => artist.name).join(', ')}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
};

MusicFeature.displayName = 'MusicFeature';

export { MusicFeature };
