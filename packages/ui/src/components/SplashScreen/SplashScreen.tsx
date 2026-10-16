import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import { MorphingRing } from '@ValenceUI/MorphingRing';
import { layoutBoxOf } from '@ValenceUI/layoutBoxOf';
import { WordReveal } from '@ValenceUI/WordReveal';
import { splashIntro } from './splashIntro';
import type { SplashScreenProps } from './SplashScreen.types';
import { say } from '@ValenceI18n/say';

const OURS = 'valence';

const MARK_RISES_MILLISECONDS = 220;

const NAME_PAUSE_MILLISECONDS = 450;

const CARD_RADIUS = 20;

const INSET = `inset(12px round ${CARD_RADIUS.toString()}px)`;

const EDGE_TO_EDGE = 'inset(0px round 0px)';

const CARD_OPENS_SECONDS = 1.2;

const LANDS_MILLISECONDS = 650;

const RING_FADES_MILLISECONDS = 300;

const FADES_MILLISECONDS = 260;

const NAME_AT_MILLISECONDS = MARK_RISES_MILLISECONDS + NAME_PAUSE_MILLISECONDS;

const DONE_AT_MILLISECONDS = NAME_AT_MILLISECONDS + CARD_OPENS_SECONDS * 1000;

/**
 * Holds the screen with the platform's own mark while the application works out what it is showing
 * — whether setup is done, who is signed in, and what was being watched. Its own mark, since this
 * is the first thing anybody sees, with a ring at the foot of the screen filling and turning while
 * it waits.
 *
 * The mark rises into place and, after a beat, the name opens out beside it, letter by letter, as
 * it does at the top of the home page. That only holds while the platform is called Valence: an operator who
 * has renamed it gets the name set instead, since the mark is not theirs to stand for.
 *
 * Everything sits on a rounded card inset from the edges of the screen. It opens filling the screen
 * edge to edge, and as the name opens out its edges draw in to their place and its corners round,
 * rather than the whole card shrinking. When it leaves, the ground around the card fades to show
 * the page, and where the page has a card at the top marked as the place to land — the home page's
 * featured title — the splash card's edges draw in onto it before the splash card fades over it.
 * Where that card rests is measured once the page has laid itself out, leaving out the slide the
 * page arrives with, so the splash card lands where the card will be rather than where it was
 * partway through arriving.
 * While it leaves it sinks beneath the bar along the top, so the mark flying to its place there is
 * never covered by the card it left.
 *
 * A splash screen drawn in place of another carries on the opening from where it had got to, so
 * the hand-over between them never shows the mark rising twice.
 *
 * The ground it holds is opaque until the mark has finished travelling, and only then fades. A
 * screen that vanishes the moment the mark sets off shows the page arriving underneath a logo still
 * in flight, which reads as two things happening rather than one handing over to the other.
 *
 * @param name - What the platform is called, which may have been renamed by an operator.
 * @param label - What is being waited for, read out to anybody who cannot see the screen.
 * @param isReady - Whether what was being waited for has arrived, which has the ring fill the rest
 *   of its segments quickly and then fade.
 * @param marksPlace - The name the mark travels under, where it goes on to somewhere else.
 * @param hasMark - Whether this screen is the one holding the mark. False once the mark has been
 *   handed on, so that two of them are never on screen under the same name.
 * @param isLeaving - Whether the ground is fading, which it does once the mark has landed.
 * @param onIntroDone - Told once the mark, the name and the card have all finished arriving and
 *   the ring has filled and faded, which is the soonest the screen should be let go of.
 * @param onLeft - Told once it has finished leaving, so it can be taken away.
 */
const SplashScreen = ({
  name = say('common.valence'),
  label = say('common.loading'),
  isReady = false,
  marksPlace,
  hasMark = true,
  isLeaving = false,
  onIntroDone,
  onLeft,
}: SplashScreenProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  const isOurs = name.toLowerCase() === OURS;
  const [startedAt] = useState(() => {
    splashIntro.startedAt ??= Date.now();

    return splashIntro.startedAt;
  });
  const [isCarryingOn] = useState(() => Date.now() - startedAt > 50);
  const [hadLanded] = useState(() => Date.now() - startedAt >= NAME_AT_MILLISECONDS);
  const [hasLanded, setHasLanded] = useState(prefersReducedMotion === true || hadLanded);
  const [hasIntroPlayed, setHasIntroPlayed] = useState(false);
  const [isRingFull, setIsRingFull] = useState(false);
  const ringFilled = useCallback(() => {
    setIsRingFull(true);
  }, []);

  useEffect(() => {
    const since = Date.now() - startedAt;
    const lands = setTimeout(
      () => {
        setHasLanded(true);
      },
      prefersReducedMotion === true ? 0 : Math.max(0, NAME_AT_MILLISECONDS - since),
    );
    const finishes = setTimeout(
      () => {
        setHasIntroPlayed(true);
      },
      prefersReducedMotion === true ? 0 : Math.max(0, DONE_AT_MILLISECONDS - since),
    );

    return () => {
      clearTimeout(lands);
      clearTimeout(finishes);
    };
  }, [startedAt, prefersReducedMotion]);

  useEffect(() => {
    if (!hasIntroPlayed || !isRingFull) {
      return undefined;
    }

    const lets = setTimeout(
      () => {
        onIntroDone?.();
      },
      prefersReducedMotion === true ? 0 : RING_FADES_MILLISECONDS,
    );

    return () => {
      clearTimeout(lets);
    };
  }, [hasIntroPlayed, isRingFull, prefersReducedMotion, onIntroDone]);

  const [landing, setLanding] = useState<{ clip: string | null } | null>(null);

  useEffect(() => {
    if (!isLeaving) {
      return undefined;
    }

    let gone: ReturnType<typeof setTimeout> | undefined;
    let second = 0;

    const land = () => {
      const found = document.querySelector('[data-splash-lands]');
      const target = found instanceof HTMLElement ? layoutBoxOf(found) : null;
      const isOnScreen = target !== null && target.top < window.innerHeight && target.height > 0;

      if (!isOnScreen || prefersReducedMotion === true) {
        setLanding({ clip: null });
      } else {
        setLanding({
          clip: `inset(${Math.max(0, target.top).toString()}px ${Math.max(0, window.innerWidth - target.left - target.width).toString()}px ${Math.max(0, window.innerHeight - target.top - target.height).toString()}px ${Math.max(0, target.left).toString()}px round ${CARD_RADIUS.toString()}px)`,
        });
      }

      gone = setTimeout(
        () => {
          onLeft?.();
        },
        isOnScreen && prefersReducedMotion !== true
          ? LANDS_MILLISECONDS + FADES_MILLISECONDS
          : FADES_MILLISECONDS,
      );
    };

    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(land);
    });

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clearTimeout(gone);
    };
  }, [isLeaving, prefersReducedMotion, onLeft]);

  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={`fixed inset-0 ${isLeaving ? 'pointer-events-none z-20' : 'z-50'}`}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[var(--frame-back)]"
        animate={{ opacity: isLeaving ? 0 : 1 }}
        transition={{ duration: FADES_MILLISECONDS / 1000, ease: 'easeOut' }}
      />

      <motion.div
        initial={prefersReducedMotion === true || hadLanded ? false : { clipPath: EDGE_TO_EDGE }}
        animate={
          !isLeaving || landing === null
            ? { clipPath: hasLanded || isLeaving ? INSET : EDGE_TO_EDGE, opacity: 1 }
            : landing.clip === null
              ? { clipPath: INSET, opacity: 0 }
              : { clipPath: landing.clip, opacity: 0 }
        }
        transition={
          prefersReducedMotion === true
            ? stillTransition
            : isLeaving && landing !== null && landing.clip !== null
              ? {
                  clipPath: { duration: LANDS_MILLISECONDS / 1000, ease: [0.22, 1, 0.36, 1] },
                  opacity: {
                    delay: LANDS_MILLISECONDS / 1000,
                    duration: FADES_MILLISECONDS / 1000,
                    ease: 'easeOut',
                  },
                }
              : isLeaving && landing?.clip === null
                ? { duration: FADES_MILLISECONDS / 1000, ease: 'easeOut' }
                : { duration: CARD_OPENS_SECONDS, ease: [0.22, 1, 0.36, 1] }
        }
        className="absolute inset-0 flex items-center justify-center bg-surface"
      >
        {!hasMark ? null : (
          <motion.span
            {...(marksPlace === undefined ? {} : { layoutId: marksPlace })}
            initial={
              isCarryingOn ? false : { opacity: 0, y: prefersReducedMotion === true ? 0 : 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.22, ease: 'easeOut' },
              y: { duration: 0.22, ease: 'easeOut' },
              layout: prefersReducedMotion === true ? stillTransition : liquidSpring,
            }}
            className="flex items-center justify-center"
          >
            {isOurs ? (
              <Logo size={56} isSolid label={name} />
            ) : (
              <p className="text-4xl font-semibold tracking-[-0.05em] text-text sm:text-5xl">
                {name}
              </p>
            )}
          </motion.span>
        )}

        {!hasMark || !isOurs ? null : (
          <WordReveal
            word={name}
            isShown={hasLanded}
            hasArrived={hadLanded}
            wordClassName="pl-5 text-6xl font-normal"
          />
        )}

        <AnimatePresence>
          {isRingFull ? null : (
            <motion.span
              key="spinner"
              exit={{ opacity: 0 }}
              transition={{
                duration: prefersReducedMotion === true ? 0 : RING_FADES_MILLISECONDS / 1000,
                ease: 'easeOut',
              }}
              className="absolute bottom-16 flex text-text/40"
            >
              <MorphingRing size={50} isTurning isFinishing={isReady} onFilled={ringFilled} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

SplashScreen.displayName = 'SplashScreen';

export { SplashScreen };
