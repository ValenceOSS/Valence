import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { DotField } from '@ValenceUI/DotField';
import { blendLights } from '@ValenceUI/blendLights';
import { cn } from '@ValenceUI/cn';
import type { DotFieldProps } from '@ValenceUI/DotField.types';
import type { MoodBackgroundProps, MoodLight } from './MoodBackground.types';
import { HOUSE_LIGHTS } from '@ValenceCore/tokens/houseLights';

const BLOOM_COLUMNS = ['8%', '36%', '64%', '92%'] as const;

const BLOOM_ROWS = [
  { y: '10%', strength: 36 },
  { y: '48%', strength: 28 },
  { y: '86%', strength: 22 },
] as const;

const BLOOMS = BLOOM_ROWS.flatMap((row) =>
  BLOOM_COLUMNS.map((x) => ({ at: `${x} ${row.y}`, size: '48vw 46vh', strength: row.strength })),
);

const FALLBACK_BLOOM = { at: '50% 45%', size: '48vw 46vh', strength: 24 } as const;

const DRIFTS = [
  '34s',
  '46s',
  '58s',
  '41s',
  '52s',
  '38s',
  '61s',
  '44s',
  '49s',
  '36s',
  '55s',
  '43s',
] as const;

const HOUSE = HOUSE_LIGHTS;

const DEFAULT_LIGHTS: MoodLight[] = HOUSE.map((color) => ({ color }));

const EASE = 0.03;

const PARALLAX = 0.34;

/**
 * Gives every bloom a light, so the room always has the same lights in it and changing what is
 * featured only ever moves them. The lights given take the first blooms, each where it came from in
 * the picture; every bloom past them holds the nearest colour, in its own place, at no strength, so
 * a picture with more lights than the last fades the extra ones in rather than switching them on.
 *
 * @param lights - The lights given, at least one.
 * @returns A light for each bloom.
 */
const everyBloom = (lights: readonly MoodLight[]): MoodLight[] =>
  BLOOMS.map((bloom, at) => {
    const given = lights[at];
    const nearest = lights[at % lights.length] ?? lights[0];

    return given === undefined
      ? { color: nearest?.color ?? '', at: bloom.at, weight: 0 }
      : { color: given.color, at: given.at ?? bloom.at, weight: given.weight ?? 1 };
  });

/**
 * Writes one light as the CSS gradient that paints it, at the position and colour it was given.
 *
 * @param light - The colour, where it sits and how strongly it shines.
 * @param at - Which of the lights this is, which decides how large and strong its bloom is.
 * @returns The gradient, as CSS.
 */
const paint = (light: MoodLight, at: number): string => {
  const bloom = BLOOMS[at] ?? FALLBACK_BLOOM;

  const strength = Math.round(bloom.strength * (light.weight ?? 1) * 100) / 100;

  return `radial-gradient(${bloom.size} at ${light.at ?? bloom.at}, color-mix(in oklab, ${light.color} ${strength.toString()}%, transparent), transparent 70%)`;
};

/**
 * Lights the page from behind with colours taken from whatever is on screen, so a library of a film
 * is lit by that film. The lights drift slowly rather than holding still, and can carry a grid over
 * them for the pages that want structure behind the artwork.
 *
 * Given a film it hands it to the grid it already draws, which stops rippling and shows the film
 * instead. It is the same field of dots either way — that is the whole joke, and it only works
 * because they were a display all along.
 *
 * @param lights - The colours and where they sit.
 * @param hasGrid - Whether to lay a grid over them.
 * @param isDrifting - Whether the lights move, or hold where they are.
 * @param film - A film for the grid to play, if there is one.
 */
const MoodBackground = ({
  lights = [],
  hasGrid = false,
  isDrifting = false,
  film = null,
}: MoodBackgroundProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const given = lights.filter((light) => light.color !== '');
  const lit = everyBloom(given.length === 0 ? DEFAULT_LIGHTS : given);
  const heldRef = useRef<MoodLight[]>([]);
  const wantedRef = useRef<MoodLight[]>(lit);
  const paintedRef = useRef<string[]>([]);
  const driftingRef = useRef<HTMLDivElement | null>(null);
  const shiftedRef = useRef(-1);
  const isShowingFilm = film !== null;
  const filmRef = useRef(isShowingFilm);

  const gridProps: DotFieldProps = film === null ? {} : { frame: film };

  useEffect(() => {
    filmRef.current = isShowingFilm;
    wantedRef.current = lit;
  });

  useEffect(() => {
    if (heldRef.current.length === 0) {
      heldRef.current = wantedRef.current;
    }

    let frame = 0;

    const carry = () => {
      const wanted = wantedRef.current;

      heldRef.current =
        prefersReducedMotion === true ? wanted : blendLights(heldRef.current, wanted, EASE);

      const shift = filmRef.current ? 0 : Math.round(window.scrollY * PARALLAX);
      const drifting = driftingRef.current;

      if (drifting !== null && shiftedRef.current !== shift) {
        shiftedRef.current = shift;
        drifting.style.transform = `translate3d(0, ${shift.toString()}px, 0)`;
      }

      heldRef.current.forEach((light, at) => {
        const element = drifting?.children.item(at);
        const painted = paint(light, at);

        if (element instanceof HTMLElement && paintedRef.current[at] !== painted) {
          paintedRef.current[at] = painted;
          element.style.background = painted;
        }
      });

      frame = requestAnimationFrame(carry);
    };

    frame = requestAnimationFrame(carry);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      role="presentation"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[140svh] overflow-hidden',
        isShowingFilm && 'valence-below-the-bar h-[calc(100svh-var(--valence-window-bar))]',
      )}
    >
      <div ref={driftingRef} className="absolute inset-0 will-change-transform">
        {lit.map((light, at) => (
          <span
            key={`bloom-${at.toString()}`}
            className={
              isDrifting && prefersReducedMotion !== true
                ? 'valence-bloom valence-bloom--drift'
                : 'valence-bloom'
            }
            style={{
              background: paint(light, at),
              animationDuration: DRIFTS[at] ?? '40s',
            }}
          />
        ))}

        {hasGrid || isShowingFilm ? <DotField {...gridProps} /> : null}
      </div>

      <span className="valence-mood-fade" />
    </div>
  );
};

MoodBackground.displayName = 'MoodBackground';

export { MoodBackground };
