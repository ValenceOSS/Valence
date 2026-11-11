import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { ShaderMount } from '@paper-design/shaders-react';
import { HOUSE_LIGHTS } from '@ValenceCore/tokens/houseLights';
import { moodOrbShader } from './moodOrbShader';
import { tintOf } from './tintOf';
import type { MoodBackgroundProps, MoodLight } from './MoodBackground.types';

const ACROSS = 6;

const DOWN = 4;

const STRONGEST = 0.42;

const FAINTEST = 0.2;

const BLOOMS = Array.from({ length: ACROSS * DOWN }, (_, at) => {
  const column = at % ACROSS;
  const row = Math.floor(at / ACROSS);

  return {
    at: `${(Math.round(((column + 0.5) / ACROSS) * 1000) / 10).toString()}% ${(Math.round(((row + 0.5) / DOWN) * 1000) / 10).toString()}%`,
    strength: STRONGEST - ((STRONGEST - FAINTEST) * row) / (DOWN - 1),
  };
});

const ORB_REACH = 0.24;

const FOLLOWS_WITHIN_MS = 240;

const SETTLED = 0.002;

const LIVELY = 0.3;

const DEFAULT_LIGHTS: MoodLight[] = HOUSE_LIGHTS.map((color) => ({ color }));

const PARALLAX = 0.34;

const PIXEL_BUDGET = 640 * 400;

type Orbs = number[][];

/**
 * Gives every bloom a light, so the room always has the same lights in it and changing what is
 * featured only ever moves them. A picture read as a full grid gives each bloom its own light,
 * where it came from in the picture; fewer lights, such as the house colours or one chosen colour,
 * repeat across the grid so the whole page still glows.
 *
 * @param lights - The lights given, at least one.
 * @returns A light for each bloom.
 */
const everyBloom = (lights: readonly MoodLight[]): MoodLight[] =>
  BLOOMS.map((bloom, at) => {
    const given = lights.length >= BLOOMS.length ? lights[at] : lights[at % lights.length];

    return given === undefined
      ? { color: '', at: bloom.at, weight: 0 }
      : {
          color: given.color,
          at: at < lights.length ? (given.at ?? bloom.at) : bloom.at,
          weight: given.weight ?? 1,
        };
  });

/**
 * Turns the lights into what the shader draws: where each orb sits, how strongly it shines and the
 * colour it shines in.
 *
 * @param lit - A light for each bloom.
 * @returns Each orb's place, strength, red, green and blue.
 */
const orbsOf = (lit: readonly MoodLight[]): Orbs =>
  lit.map((one, at) => {
    const bloom = BLOOMS[at] ?? BLOOMS[0];
    const [across = '50%', down = '45%'] = (one.at ?? bloom?.at ?? '50% 45%').trim().split(/\s+/u);

    return [
      Number.parseFloat(across) / 100,
      Number.parseFloat(down) / 100,
      (bloom?.strength ?? FAINTEST) * (one.weight ?? 1),
      ...tintOf(one.color),
    ];
  });

/**
 * Carries one set of orbs part of the way towards another.
 *
 * @param from - Where they were.
 * @param to - Where they are going.
 * @param progress - How far along, from nothing to all the way.
 * @returns The orbs in between.
 */
const between = (from: Orbs, to: Orbs, progress: number): Orbs =>
  to.map((row, at) =>
    row.map((value, index) => {
      const was = from[at]?.[index] ?? value;

      return was + (value - was) * progress;
    }),
  );

/**
 * Packs each orb into the four numbers the shader takes for it, the colour folded into one, so every
 * orb fits in what any graphics chip allows a shader to be given.
 *
 * @param orbs - Each orb's place, strength, red, green and blue.
 * @returns Each orb as place, strength and packed colour.
 */
const packed = (orbs: Orbs): number[][] =>
  orbs.map(([x = 0, y = 0, strength = 0, red = 0, green = 0, blue = 0]) => [
    x,
    y,
    strength,
    Math.round(red * 255) * 65536 + Math.round(green * 255) * 256 + Math.round(blue * 255),
  ]);

/**
 * Lights the page from behind with colours taken from whatever is on screen, so a library of a film
 * is lit by that film. Each light is a soft orb drawn by a shader, shaded a little like a sphere
 * so the room reads as having depth. The orbs follow new colours continuously, closing most of
 * the gap within a quarter of a second, so a playing trailer lights the page as it plays. The lights drift slowly rather than holding still, and can carry a grid over
 * over the page.
 *
 * @param lights - The colours and where they sit.
 * @param isDrifting - Whether the lights move, or hold where they are.
 * @param isLively - Whether they drift quickly enough to be seen moving, for a screen that is being
 *   waited on rather than read.
 */
const MoodBackground = ({
  lights = [],
  isDrifting = false,
  isLively = false,
}: MoodBackgroundProps) => {
  const prefersReducedMotion = useReducedMotionConfig() === true;
  const given = lights.filter((one) => one.color !== '');
  const lit = everyBloom(given.length === 0 ? DEFAULT_LIGHTS : given);
  const key = lit
    .map((one) => `${one.color}@${one.at ?? ''}*${(one.weight ?? 1).toString()}`)
    .join('|');
  const litRef = useRef(lit);
  const [shown, setShown] = useState<Orbs>(() => orbsOf(lit));
  const shownRef = useRef(shown);
  const driftingRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    litRef.current = lit;
    shownRef.current = shown;
  });

  useEffect(() => {
    const target = orbsOf(litRef.current);

    if (prefersReducedMotion) {
      setShown(target);

      return undefined;
    }

    let frame = 0;
    let last = performance.now();

    const follow = (now: number) => {
      const step = 1 - Math.exp(-(now - last) / FOLLOWS_WITHIN_MS);
      const next = between(shownRef.current, target, step);
      const gap = Math.max(
        ...next.flatMap((row, at) =>
          row.map((value, index) => Math.abs((target[at]?.[index] ?? value) - value)),
        ),
      );

      last = now;
      shownRef.current = gap < SETTLED ? target : next;
      setShown(shownRef.current);

      if (gap >= SETTLED) {
        frame = requestAnimationFrame(follow);
      }
    };

    frame = requestAnimationFrame(follow);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [key, prefersReducedMotion]);

  useEffect(() => {
    let shifted = -1;

    const follow = () => {
      const shift = Math.round(window.scrollY * PARALLAX);
      const drifting = driftingRef.current;

      if (drifting !== null && shift !== shifted) {
        shifted = shift;
        drifting.style.transform = `translate3d(0, ${shift.toString()}px, 0)`;
      }
    };

    follow();
    window.addEventListener('scroll', follow, { passive: true });

    return () => {
      window.removeEventListener('scroll', follow);
    };
  }, []);

  const isMoving = isDrifting && !prefersReducedMotion;
  const uniforms = useMemo(
    () => ({ u_orbs: packed(shown), u_reach: ORB_REACH, u_drift: isMoving ? 1 : 0 }),
    [shown, isMoving],
  );

  return (
    <div
      role="presentation"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[140svh] overflow-hidden"
    >
      <div
        ref={driftingRef}
        data-slot="mood-orbs"
        className="absolute inset-0 opacity-[var(--bloom-strength)] will-change-transform"
      >
        <ShaderMount
          fragmentShader={moodOrbShader}
          uniforms={uniforms}
          speed={isMoving ? (isLively ? 1 / LIVELY : 1) : 0}
          maxPixelCount={PIXEL_BUDGET}
          minPixelRatio={1}
          className="block h-full w-full"
        />
      </div>

      <span className="valence-mood-fade" />
    </div>
  );
};

MoodBackground.displayName = 'MoodBackground';

export { MoodBackground };
