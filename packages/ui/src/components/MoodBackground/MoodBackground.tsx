import { useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
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

const LIVELY = 0.3;

const HOUSE = HOUSE_LIGHTS;

const DEFAULT_LIGHTS: MoodLight[] = HOUSE.map((color) => ({ color }));

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
 * Hands one light to the bloom that draws it, as the values its gradient is written in terms of,
 * so the browser can carry the bloom from its last light to this one on its own.
 *
 * @param element - The bloom.
 * @param given - The colour, where it sits and how strongly it shines.
 * @param at - Which of the lights this is, which decides how strong its bloom is.
 */
const lightBloom = (element: HTMLElement, given: MoodLight, at: number): void => {
  const bloom = BLOOMS[at] ?? FALLBACK_BLOOM;
  const [across = '50%', down = '45%'] = (given.at ?? bloom.at).trim().split(/\s+/);
  const strength = Math.round(bloom.strength * (given.weight ?? 1) * 100) / 100;

  element.style.setProperty('--bloom-color', given.color);
  element.style.setProperty('--bloom-x', across);
  element.style.setProperty('--bloom-y', down);
  element.style.setProperty('--bloom-mix', `${strength.toString()}%`);
};

/**
 * Lights the page from behind with colours taken from whatever is on screen, so a library of a film
 * is lit by that film. The lights drift slowly rather than holding still, and can carry a grid over
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
  const prefersReducedMotion = useReducedMotionConfig();
  const given = lights.filter((one) => one.color !== '');
  const lit = everyBloom(given.length === 0 ? DEFAULT_LIGHTS : given);
  const key = lit
    .map((one) => `${one.color}@${one.at ?? ''}*${(one.weight ?? 1).toString()}`)
    .join('|');
  const litRef = useRef(lit);
  const driftingRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    litRef.current = lit;
  });

  useEffect(() => {
    const drifting = driftingRef.current;

    litRef.current.forEach((one, at) => {
      const element = drifting?.children.item(at);

      if (element instanceof HTMLElement) {
        lightBloom(element, one, at);
      }
    });
  }, [key]);

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

  return (
    <div
      role="presentation"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[140svh] overflow-hidden"
    >
      <div ref={driftingRef} className="absolute inset-0 will-change-transform">
        {lit.map((_, at) => (
          <span
            key={`bloom-${at.toString()}`}
            className={
              isDrifting && prefersReducedMotion !== true
                ? 'valence-bloom valence-bloom--drift'
                : 'valence-bloom'
            }
            style={{
              animationDuration: `${(Number.parseFloat(DRIFTS[at] ?? '40') * (isLively ? LIVELY : 1)).toString()}s`,
            }}
          />
        ))}
      </div>

      <span className="valence-mood-fade" />
    </div>
  );
};

MoodBackground.displayName = 'MoodBackground';

export { MoodBackground };
