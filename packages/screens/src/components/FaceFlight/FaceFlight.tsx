import { useEffect } from 'react';
import { useAnimate, useReducedMotionConfig } from 'motion/react';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import type { FaceFlightProps } from './FaceFlight.types';

const LIFTS_BY = 18;

const LIFTS_TO = 1.06;

const LIFTS_OVER = 0.36;

const GIVES_UP_AFTER_MS = 4000;

const FADES_OVER = 0.18;

const LANDS = { type: 'spring', stiffness: 190, damping: 17 } as const;

const ARRIVING = 'faceArriving';

/**
 * Somebody's face on its way from the way in to the face on the bar once they are in, as the phone
 * carries it: lifted off the page, rounded into the circle the bar draws, and then sprung into the
 * bar's place, where the bar's own face is shown again in the same moment.
 *
 * It waits in the air until the bar has drawn its face, and gives up and fades if it never does.
 * While it is in the air the page says so, and the bar keeps its own face hidden, so there are never
 * two of the one face on screen.
 *
 * @param profile - Whose face.
 * @param at - Where it was on the way in.
 * @param onLanded - Told once it has landed, or given up.
 */
const FaceFlight = ({ profile, at, onLanded }: FaceFlightProps) => {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    if (prefersReducedMotion === true) {
      onLanded();

      return undefined;
    }

    let isCancelled = false;
    const page = document.documentElement;

    page.dataset[ARRIVING] = 'true';

    const fly = async () => {
      await animate(
        scope.current,
        { y: -LIFTS_BY, scale: LIFTS_TO, borderRadius: at.width / 2 },
        { duration: LIFTS_OVER, ease: [0.33, 1, 0.68, 1] },
      );

      const began = performance.now();
      let landing: DOMRect | null = null;

      while (!isCancelled && performance.now() - began < GIVES_UP_AFTER_MS) {
        const place = document.querySelector('[data-face-lands]')?.getBoundingClientRect();

        if (place !== undefined && place.width > 0) {
          landing = place;

          break;
        }

        await new Promise((next) => requestAnimationFrame(next));
      }

      if (isCancelled) {
        return;
      }

      await (landing === null
        ? animate(scope.current, { opacity: 0 }, { duration: FADES_OVER })
        : animate(
            scope.current,
            {
              x: landing.x + landing.width / 2 - (at.x + at.width / 2),
              y: landing.y + landing.height / 2 - (at.y + at.height / 2),
              scale: landing.width / at.width,
            },
            LANDS,
          ));

      delete page.dataset[ARRIVING];
      onLanded();
    };

    void fly();

    return () => {
      isCancelled = true;
      delete page.dataset[ARRIVING];
    };
  }, [animate, at, onLanded, prefersReducedMotion, scope]);

  return (
    <div
      ref={scope}
      aria-hidden
      className="pointer-events-none fixed z-[70] overflow-hidden rounded-xl"
      style={{ left: at.x, top: at.y, width: at.width, height: at.height }}
    >
      <ProfileFace profile={profile} shape="tile" className="size-full text-5xl" />
    </div>
  );
};

FaceFlight.displayName = 'FaceFlight';

export { FaceFlight };
