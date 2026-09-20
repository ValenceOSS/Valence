import type { AmbientOrbsProps } from './AmbientOrbs.types';

const PLACES = [
  'left-[-10%] top-[-15%]',
  'right-[-10%] top-[-15%]',
  'left-[-10%] bottom-[-15%]',
  'right-[-10%] bottom-[-15%]',
] as const;

/**
 * The glow behind the picture: four soft orbs of light, one in each corner, each the colour of the
 * quarter of the picture nearest it. They ease from one colour to the next rather than jumping, so
 * a cut in the film reads as the room changing colour and not as flicker.
 *
 * @param lights - The colour of each quarter of the picture, top left first.
 */
const AmbientOrbs = ({ lights }: AmbientOrbsProps) => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {PLACES.map((place, at) => (
      <span
        key={place}
        className={`absolute size-[70vmax] rounded-full opacity-55 blur-[8rem] transition-[background-color] duration-[900ms] ease-linear motion-reduce:transition-none ${place}`}
        style={{ backgroundColor: lights[at] ?? 'transparent' }}
      />
    ))}
  </div>
);

AmbientOrbs.displayName = 'AmbientOrbs';

export { AmbientOrbs };
