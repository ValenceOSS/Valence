import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { useReducedMotionConfig, motion } from 'motion/react';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { albumArtworkUrl, fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicBackdrop } from '@ValenceScreens/components/MusicBackdrop/MusicBackdrop';
import { PLAY_ON_ARTWORK } from '@ValenceScreens/music/PLAY_ON_ARTWORK';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { isPlayingFrom } from '@ValenceScreens/music/isPlayingFrom';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { MusicFeatureProps } from './MusicFeature.types';
import { say } from '@ValenceI18n/say';

/**
 * The head of the music home: the newest record in the library, ready to start, on its cover spread
 * across the page. What is playing has the player bar to itself, so this leaves it there and stays
 * low enough for the rails to be seen beneath it.
 *
 * @param newest - The album most recently added.
 * @param player - The player to drive, which is the window's own unless a test says otherwise.
 */
const MusicFeature = ({ newest, player: given }: MusicFeatureProps) => {
  const { state, player } = useMusicPlayer(given ?? theMusicPlayer());
  const { open } = useMusicNavigation();
  const prefersReducedMotion = useReducedMotionConfig();
  const rises = revealVariants(prefersReducedMotion);
  const moves = revealTransition(prefersReducedMotion);

  if (newest === null) {
    return null;
  }

  const cover = newest.hasArtwork ? albumArtworkUrl(newest.id) : null;
  const isOn = isPlayingFrom({ kind: 'album', id: newest.id }, state);
  const isPlaying = isOn && state.isPlaying;

  return (
    <section
      aria-label={say('screens.musicHome.musicFeature.newestInYourLibrary')}
      className={`relative flex h-[clamp(15rem,36vh,20rem)] items-end overflow-hidden pb-6 ${MUSIC_LANES.page}`}
    >
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <MusicBackdrop src={cover} />
        <BackdropScrim />
      </div>

      <div className="relative flex w-full items-end gap-5 sm:gap-6">
        <Button
          variant="bare"
          size="none"
          label={say('common.openTitle', { title: newest.title })}
          hasTooltip={false}
          className="hidden w-28 shrink-0 sm:block lg:w-36"
          onClick={() => {
            open({ kind: 'album', id: newest.id });
          }}
        >
          <MusicArtwork src={cover} label={newest.title} isLifted className="w-full" />
        </Button>

        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="@container flex min-w-0 flex-1 flex-col gap-1.5"
        >
          <motion.span
            variants={rises}
            transition={moves}
            className="text-xs font-semibold text-on-scrim"
          >
            {say('screens.musicHome.musicFeature.newestInYourLibrary')}
          </motion.span>

          <motion.h2
            variants={rises}
            transition={moves}
            className="truncate text-[clamp(1.75rem,7cqi,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-on-scrim"
          >
            {newest.title}
          </motion.h2>

          <motion.p variants={rises} transition={moves} className="text-sm text-on-scrim">
            {newest.artist.name}
          </motion.p>

          <motion.div variants={rises} transition={moves} className="mt-2">
            <Button
              variant="confirm"
              size="none"
              className={`${PLAY_ON_ARTWORK} sm:w-56`}
              onClick={() => {
                if (isOn) {
                  player.toggle();

                  return;
                }

                void fetchAlbum(newest.id).then((read) => {
                  player.play(read.tracks, 0, {
                    source: { kind: 'album', id: newest.id, name: newest.title },
                  });
                });
              }}
            >
              <Icon of={isPlaying ? PauseFilledIcon : PlayFilledIcon} size={18} />
              {isPlaying ? say('common.pause') : say('common.play')}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

MusicFeature.displayName = 'MusicFeature';

export { MusicFeature };
