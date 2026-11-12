import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import { Button } from '@ValenceUI/Button';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { PausedScreenProps } from './PausedScreen.types';
import { say } from '@ValenceI18n/say';

const LOGO_BOX =
  'max-h-[clamp(4.5rem,18svh,9rem)] w-auto max-w-[min(60vw,28rem)] object-contain object-left';

const RISES = { duration: 0.5, ease: [0.23, 1, 0.32, 1] } as const;

const BETWEEN_LINES = 0.06;

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
 * @param secondsLeft - How much of it is left to watch, said under the overview.
 * @param asking - The episode up next and who to tell the answer, while asking whether anybody is
 *   still watching.
 */
const PausedScreen = ({ media, isShown, secondsLeft, asking }: PausedScreenProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const told = asking?.upNext ?? media;
  const isOn = isShown || asking !== undefined;
  const asked = useQuery({ ...libraryQueries.detail(told.id), enabled: isOn });
  const overview = asked.data?.metadata.overview ?? null;
  const [unlettered, setUnlettered] = useState<string | null>(null);
  const isLettered =
    (told.hasLogo === true || asked.data?.metadata.hasLogo === true) && unlettered !== told.id;
  const isAnEpisode = typeof media.seriesTitle === 'string' && media.seriesTitle !== '';
  const named =
    isAnEpisode && typeof told.episodeNumber === 'number'
      ? say('screens.videoPlayer.pausedScreen.titleEpEpisodeNumber', {
          title: told.title,
          episodeNumber: describeEpisodeNumbers(
            told.episodeNumber,
            asked.data?.metadata.episodeNumberEnd,
          ),
        })
      : null;
  const episode =
    named === null || asking === undefined
      ? named
      : say('screens.videoPlayer.pausedScreen.upNextEpisode', { episode: named });
  const hasSeason = isAnEpisode && typeof told.seasonNumber === 'number';

  const line = (order: number) =>
    prefersReducedMotion === true
      ? {}
      : {
          initial: { opacity: 0, transform: 'translateY(8px)' },
          animate: { opacity: 1, transform: 'translateY(0px)' },
          transition: { ...RISES, delay: 0.12 + order * BETWEEN_LINES },
        };

  return (
    <AnimatePresence>
      {isOn ? (
        <motion.div
          key="paused"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: prefersReducedMotion === true ? 0.2 : 0.5, ease: 'easeOut' },
          }}
          exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
          className={`${asking === undefined ? 'pointer-events-none ' : ''}absolute inset-0 z-30 flex flex-col justify-end bg-[radial-gradient(120%_90%_at_0%_100%,color-mix(in_oklab,var(--color-shade)_85%,transparent),color-mix(in_oklab,var(--color-shade)_55%,transparent)_45%,color-mix(in_oklab,var(--color-shade)_25%,transparent))] px-[clamp(1.5rem,7vw,7rem)] pb-[clamp(2rem,12vh,7rem)] text-on-scrim`}
        >
          <div className="flex max-w-2xl flex-col items-start gap-3">
            <motion.span
              {...line(0)}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-on-scrim/60"
            >
              {asking === undefined ? say('common.paused') : say('common.areYouStillWatching')}
            </motion.span>

            <motion.div {...line(1)}>
              {isLettered ? (
                <TitleLogo
                  src={titleLogoUrl(told.id)}
                  alt={(isAnEpisode ? media.seriesTitle : null) ?? media.title}
                  className={LOGO_BOX}
                  onError={() => {
                    setUnlettered(told.id);
                  }}
                />
              ) : (
                <span className="block text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                  {isAnEpisode ? media.seriesTitle : media.title}
                </span>
              )}
            </motion.div>

            {episode === null && !hasSeason ? null : (
              <motion.p {...line(2)} className="text-base font-medium sm:text-lg">
                {hasSeason
                  ? say('common.seasonSeasonNumber', { seasonNumber: told.seasonNumber ?? 0 })
                  : null}
                {hasSeason && episode !== null ? (
                  <span aria-hidden className="px-2 text-on-scrim/50">
                    ·
                  </span>
                ) : null}
                {episode}
              </motion.p>
            )}

            {overview === null || overview === '' ? null : (
              <motion.p
                {...line(3)}
                className="line-clamp-3 max-w-xl text-sm leading-relaxed text-on-scrim/75 sm:text-base"
              >
                {overview}
              </motion.p>
            )}

            {asking !== undefined || secondsLeft === undefined || secondsLeft <= 0 ? null : (
              <motion.span
                {...line(4)}
                className="text-sm font-medium tabular-nums text-on-scrim/60"
              >
                {say('common.durationLeft', { timeLeft: formatDuration(secondsLeft) })}
              </motion.span>
            )}

            {asking === undefined ? null : (
              <motion.div {...line(4)} className="mt-3 flex flex-wrap gap-3">
                <Button variant="confirm" size="xl" autoFocus onClick={asking.onCarryOn}>
                  {say('common.continueWatching')}
                </Button>
                <Button variant="overlay" size="xl" onClick={asking.onStop}>
                  {say('common.stop')}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

PausedScreen.displayName = 'PausedScreen';

export { PausedScreen };
