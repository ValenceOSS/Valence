import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import type { PausedScreenProps } from './PausedScreen.types';
import { say } from '@ValenceI18n/say';

/**
 * What is on screen once something has been left paused and nobody has touched anything for a
 * while: the picture sinks into the dark and says what is being watched — the programme, its
 * season, the episode and what happens in it — the way a television does when it is walked away
 * from. Any movement or key brings the player back, so it never stands between somebody and the
 * controls they reached for.
 *
 * @param media - What is playing.
 * @param isShown - Whether it has been left long enough to show.
 */
const PausedScreen = ({ media, isShown }: PausedScreenProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const asked = useQuery({ ...libraryQueries.detail(media.id), enabled: isShown });
  const overview = asked.data?.metadata.overview ?? null;
  const isAnEpisode = typeof media.seriesTitle === 'string' && media.seriesTitle !== '';
  const episode =
    isAnEpisode && typeof media.episodeNumber === 'number'
      ? say('screens.videoPlayer.pausedScreen.titleEpEpisodeNumber', {
          title: media.title,
          episodeNumber: describeEpisodeNumbers(
            media.episodeNumber,
            asked.data?.metadata.episodeNumberEnd,
          ),
        })
      : null;

  return (
    <AnimatePresence>
      {isShown ? (
        <motion.div
          key="paused"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion === true ? 0 : 0.6, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-center bg-linear-to-r from-shade/90 via-shade/70 to-shade/40 px-[clamp(1.5rem,12vw,14rem)] text-on-scrim"
        >
          <motion.div
            initial={prefersReducedMotion === true ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-3xl flex-col gap-2"
          >
            <span className="text-base text-on-scrim/75 sm:text-lg">
              {say('screens.videoPlayer.pausedScreen.youReWatching')}
            </span>

            <span className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              {isAnEpisode ? media.seriesTitle : media.title}
            </span>

            {isAnEpisode && typeof media.seasonNumber === 'number' ? (
              <span className="text-xl font-semibold sm:text-2xl">
                {say('common.seasonSeasonNumber', { seasonNumber: media.seasonNumber })}
              </span>
            ) : null}

            {episode === null ? null : (
              <span className="mt-4 text-lg font-semibold sm:text-2xl">{episode}</span>
            )}

            {overview === null || overview === '' ? null : (
              <p className="mt-1 line-clamp-4 max-w-2xl text-base leading-relaxed text-on-scrim/80 sm:text-lg">
                {overview}
              </p>
            )}
          </motion.div>

          <span className="absolute bottom-[clamp(1.5rem,8vh,6rem)] right-[clamp(1.5rem,8vw,8rem)] text-lg text-on-scrim/80">
            {say('common.paused')}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

PausedScreen.displayName = 'PausedScreen';

export { PausedScreen };
