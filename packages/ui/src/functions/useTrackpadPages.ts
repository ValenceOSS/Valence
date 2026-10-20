import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import type { AnimationPlaybackControls, Transition } from 'motion/react';
import type { RefObject } from 'react';

const LINE_PIXELS = 16;

const SETTLES_MS = 140;

const QUIET_MS = 220;

const COASTING_STEPS = 3;

const RISING_STEPS = 2;

type Swipe = { from: number; offset: number; lastStep: number; easing: number; at: number };

type Coast = { until: number; heading: number; lastStep: number; rising: number };

const STILL: Coast = { until: 0, heading: 0, lastStep: 0, rising: 0 };

/**
 * Where a swipe that has been let go of lands: on the page it started from, or on the next one the
 * way it went where it went far enough to mean it — never further, however fast it went.
 *
 * @param from - Where the strip was when the swipe began, in pixels.
 * @param offset - How far the swipe went, rightwards positive.
 * @param page - How wide one page is.
 * @param last - The last page there is.
 * @returns The page to land on.
 */
const landingOf = (from: number, offset: number, page: number, last: number): number => {
  const towards = Math.abs(offset) > PAGE_TURN.turnsAfter ? Math.sign(offset) : 0;

  return Math.min(Math.max(Math.round(from / page) + towards, 0), last);
};

/**
 * Turns a strip of whole-width pages by two fingers on a trackpad, a page at a time and always at
 * the same pace. The strip follows the fingers while they are down, no further than a page; once
 * they lift it glides to the page by its own ease rather than the trackpad's, so a flick lands as
 * softly as a slow swipe. Touch is left to the browser.
 *
 * A trackpad gives no word of the fingers lifting, and a Mac goes on sending the swipe for a second
 * or two as it coasts, so the swipe is let go of as soon as it is plainly coasting, or has gone a
 * whole page — and what is left of the coasting turns nothing further, while a fresh swipe, back the
 * other way or speeding up again, is followed straight away.
 *
 * The strip's own snapping and smooth scrolling are held off while it is being swiped and gliding,
 * since either would fight it, and handed back once it has landed.
 *
 * @param track - The scrolling strip, whose children are pages as wide as it is.
 * @param isOn - Whether there is more than one page to turn.
 * @param transition - How the strip glides to where it lands.
 */
const useTrackpadPages = (
  track: RefObject<HTMLElement | null>,
  isOn: boolean,
  transition: Transition,
): void => {
  const glide = useRef(transition);

  useLayoutEffect(() => {
    glide.current = transition;
  });

  useEffect(() => {
    const element = track.current;

    if (element === null || !isOn) {
      return;
    }

    let swipe: Swipe | null = null;
    let coast = STILL;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let gliding: AnimationPlaybackControls | null = null;

    const hold = () => {
      element.style.scrollSnapType = 'none';
      element.style.scrollBehavior = 'auto';
    };

    const handBack = () => {
      element.style.scrollSnapType = '';
      element.style.scrollBehavior = '';
    };

    const letGo = (at: number) => {
      const ended = swipe;

      clearTimeout(timer);
      swipe = null;

      if (ended === null) {
        return;
      }

      coast = {
        until: at + QUIET_MS,
        heading: Math.sign(ended.offset),
        lastStep: ended.lastStep,
        rising: 0,
      };

      const page = Math.max(1, element.clientWidth);
      const last = Math.max(0, Math.round((element.scrollWidth - element.clientWidth) / page));
      const landing = landingOf(ended.from, ended.offset, page, last) * page;

      gliding = animate(element.scrollLeft, landing, {
        ...glide.current,
        onUpdate: (left) => {
          element.scrollLeft = left;
        },
        onComplete: () => {
          gliding = null;
          handBack();
        },
      });
    };

    const isCoasting = (delta: number, at: number): boolean => {
      if (swipe !== null || at >= coast.until) {
        return false;
      }

      const step = Math.abs(delta);
      const rising = step > coast.lastStep ? coast.rising + 1 : 0;

      if (Math.sign(delta) !== coast.heading || rising >= RISING_STEPS) {
        coast = STILL;

        return false;
      }

      coast = { ...coast, until: at + QUIET_MS, lastStep: step, rising };

      return true;
    };

    const wheeled = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;
      }

      event.preventDefault();

      const delta = event.deltaMode === 1 ? event.deltaX * LINE_PIXELS : event.deltaX;
      const at = event.timeStamp;

      if (isCoasting(delta, at)) {
        return;
      }

      if (swipe === null) {
        gliding?.stop();
        gliding = null;
        hold();
        swipe = { from: element.scrollLeft, offset: 0, lastStep: 0, easing: 0, at };
      }

      const step = Math.abs(delta);
      const page = Math.max(1, element.clientWidth);

      swipe.easing = step < swipe.lastStep ? swipe.easing + 1 : 0;
      swipe.lastStep = step;
      swipe.offset += delta;
      swipe.at = at;
      element.scrollLeft = swipe.from + Math.min(Math.max(swipe.offset, -page), page);

      if (
        Math.abs(swipe.offset) >= page ||
        (swipe.easing >= COASTING_STEPS && Math.abs(swipe.offset) > PAGE_TURN.turnsAfter)
      ) {
        letGo(at);

        return;
      }

      clearTimeout(timer);
      timer = setTimeout(() => {
        letGo((swipe?.at ?? at) + SETTLES_MS);
      }, SETTLES_MS);
    };

    element.addEventListener('wheel', wheeled, { passive: false });

    return () => {
      element.removeEventListener('wheel', wheeled);
      clearTimeout(timer);
      gliding?.stop();
      handBack();
    };
  }, [track, isOn]);
};

export { useTrackpadPages };
