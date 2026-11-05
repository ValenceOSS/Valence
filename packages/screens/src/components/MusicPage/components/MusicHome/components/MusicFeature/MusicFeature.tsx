import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Video as VideoIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { albumArtworkUrl, fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { MusicBackdrop } from '@ValenceScreens/components/MusicBackdrop/MusicBackdrop';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { PLAY_ON_ARTWORK } from '@ValenceScreens/music/PLAY_ON_ARTWORK';
import { setMusicVideo } from '@ValenceScreens/music/musicVideo';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicFeatureProps } from './MusicFeature.types';
import { say } from '@ValenceI18n/say';

const SETTLING = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

/**
 * The large card at the front of the music home: whatever is playing, or, when nothing is, the newest
 * record in the library, ready to start.
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
      aria-label={
        song === null
          ? say('screens.musicHome.musicFeature.newestInYourLibrary')
          : say('common.nowPlaying')
      }
      className="relative flex min-h-[20rem] items-end overflow-hidden rounded-[1.5rem] bg-surface-raised p-6 lg:p-8"
    >
      <MusicBackdrop src={cover} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={song?.id ?? album.id}
          {...dissolves}
          transition={SETTLING}
          className="relative flex w-full flex-col gap-6 sm:flex-row sm:items-end sm:gap-8"
        >
          <Button
            variant="bare"
            size="none"
            label={say('common.openTitle', { title: album.title })}
            hasTooltip={false}
            className="block w-36 shrink-0 sm:w-44 lg:w-52"
            onClick={() => {
              open({ kind: 'album', id: album.id });
            }}
          >
            <MusicArtwork src={cover} label={album.title} isLifted className="w-full" />
          </Button>

          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate="shown"
            className="@container flex min-w-0 flex-1 flex-col gap-2"
          >
            <motion.span
              variants={rises}
              transition={moves}
              className="text-xs font-semibold text-on-scrim"
            >
              {song === null
                ? say('screens.musicHome.musicFeature.newestInYourLibrary')
                : state.isPlaying
                  ? say('common.nowPlaying')
                  : say('common.paused')}
            </motion.span>

            <motion.h2
              variants={rises}
              transition={moves}
              className="text-[clamp(1.5rem,11cqi,4.25rem)] font-bold leading-[0.95] tracking-[-0.035em] text-balance text-on-scrim"
            >
              {song?.title ?? album.title}
            </motion.h2>

            <motion.p variants={rises} transition={moves} className="text-sm text-on-scrim">
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
                variant="confirm"
                size="none"
                className={`${PLAY_ON_ARTWORK} sm:w-64`}
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
                  of={song !== null && state.isPlaying ? PauseFilledIcon : PlayFilledIcon}
                  size={18}
                />
                {song === null
                  ? say('common.play')
                  : state.isPlaying
                    ? say('common.pause')
                    : say('common.resume')}
              </Button>

              {song === null || song.videoKey === null ? null : (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    if (song.videoKey !== null) {
                      player.pause();
                      setMusicVideo({ title: song.title, videoKey: song.videoKey });
                    }
                  }}
                >
                  <Icon of={VideoIcon} size={18} />
                  {say('common.watchTheVideo')}
                </Button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

MusicFeature.displayName = 'MusicFeature';

export { MusicFeature };
