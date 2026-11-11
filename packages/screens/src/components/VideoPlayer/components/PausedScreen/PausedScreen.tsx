import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import { Button } from '@ValenceUI/Button';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import type { PausedScreenProps } from './PausedScreen.types';
import { say } from '@ValenceI18n/say';

const LOGO_BOX =
  'my-2 max-h-[clamp(4rem,18svh,10rem)] w-auto max-w-[min(70vw,32rem)] object-contain object-left';

/**
 * What is on screen once something has been left paused and nobody has touched anything for a
 * while: the picture sinks into the dark and says what is being watched — the programme, its
 * season, the episode and what happens in it — the way a television does when it is walked away
 * from. Any movement or key brings the player back, so it never stands between somebody and the
 * controls they reached for.
 *
 * The programme is named by its logo where it has one, as its hero does, and in type where it has
 * none or the logo will not load.
 *
 * Where enough episodes have followed on by themselves for the profile to ask whether anybody is
 * still watching, the same screen asks it over the episode just finished, naming the one up next
 * and what happens in it, with a way to carry on and a way to stop. It stays until it is answered,
 * since nothing plays while it waits.
 *
 * @param media - What is playing.
 * @param isShown - Whether it has been left long enough to show.
 * @param asking - The episode up next and who to tell the answer, while asking whether anybody is
 *   still watching.
 */
const PausedScreen = ({ media, isShown, asking }: PausedScreenProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const told = asking?.upNext ?? media;
  const isOn = isShown || asking !== undefined;
  const asked = useQuery({ ...libraryQueries.detail(told.id), enabled: isOn });
  const overview = asked.data?.metadata.overview ?? null;
  const [unlettered, setUnlettered] = useState<string | null>(null);
  const isLettered =
    (media.hasLogo === true || asked.data?.metadata.hasLogo === true) && unlettered !== media.id;
  const isAnEpisode = typeof media.seriesTitle === 'string' && media.seriesTitle !== '';
  const episode =
    isAnEpisode && typeof told.episodeNumber === 'number'
      ? say('screens.videoPlayer.pausedScreen.titleEpEpisodeNumber', {
          title: told.title,
          episodeNumber: describeEpisodeNumbers(
            told.episodeNumber,
            asked.data?.metadata.episodeNumberEnd,
          ),
        })
      : null;

  return (
    <AnimatePresence>
      {isOn ? (
        <motion.div
          key="paused"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion === true ? 0 : 0.6, ease: 'easeOut' }}
          className={`${asking === undefined ? 'pointer-events-none ' : ''}absolute inset-0 z-30 flex flex-col justify-center bg-linear-to-r from-shade/90 via-shade/70 to-shade/40 px-[clamp(1.5rem,12vw,14rem)] text-on-scrim`}
        >
          <motion.div
            initial={prefersReducedMotion === true ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-3xl flex-col gap-2"
          >
            <span className="text-base text-on-scrim/75 sm:text-lg">
              {asking === undefined
                ? say('screens.videoPlayer.pausedScreen.youReWatching')
                : say('common.areYouStillWatching')}
            </span>

            {isLettered ? (
              <TitleLogo
                src={titleLogoUrl(media.id)}
                alt={(isAnEpisode ? media.seriesTitle : null) ?? media.title}
                className={LOGO_BOX}
                onError={() => {
                  setUnlettered(media.id);
                }}
              />
            ) : (
              <span className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                {isAnEpisode ? media.seriesTitle : media.title}
              </span>
            )}

            {isAnEpisode && typeof told.seasonNumber === 'number' ? (
              <span className="text-xl font-semibold sm:text-2xl">
                {say('common.seasonSeasonNumber', { seasonNumber: told.seasonNumber })}
              </span>
            ) : null}

            {episode === null ? null : (
              <span className="mt-4 text-lg font-semibold sm:text-2xl">
                {asking === undefined
                  ? episode
                  : say('screens.videoPlayer.pausedScreen.upNextEpisode', { episode })}
              </span>
            )}

            {overview === null || overview === '' ? null : (
              <p className="mt-1 line-clamp-4 max-w-2xl text-base leading-relaxed text-on-scrim/80 sm:text-lg">
                {overview}
              </p>
            )}

            {asking === undefined ? null : (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="confirm" size="xl" autoFocus onClick={asking.onCarryOn}>
                  {say('common.continueWatching')}
                </Button>
                <Button variant="overlay" size="xl" onClick={asking.onStop}>
                  {say('common.stop')}
                </Button>
              </div>
            )}
          </motion.div>

          {asking === undefined ? (
            <span className="absolute bottom-[clamp(1.5rem,8vh,6rem)] right-[clamp(1.5rem,8vw,8rem)] text-lg text-on-scrim/80">
              {say('common.paused')}
            </span>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

PausedScreen.displayName = 'PausedScreen';

export { PausedScreen };
