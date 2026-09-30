import { AMBIENT_GRID } from '@ValenceScreens/playback/AMBIENT_GRID';
import { useAmbientLights } from '@ValenceScreens/playback/useAmbientLights';
import type { AmbientOrbsProps } from './AmbientOrbs.types';

const REACH = 1.05;

const EDGE = Array.from({ length: AMBIENT_GRID.columns * AMBIENT_GRID.rows }, (_, cell) => ({
  cell,
  column: cell % AMBIENT_GRID.columns,
  row: Math.floor(cell / AMBIENT_GRID.columns),
}))
  .filter(
    ({ column, row }) =>
      column === 0 ||
      row === 0 ||
      column === AMBIENT_GRID.columns - 1 ||
      row === AMBIENT_GRID.rows - 1,
  )
  .map(({ cell, column, row }) => ({
    cell,
    left: 50 + (((column + 0.5) / AMBIENT_GRID.columns) * 100 - 50) * REACH,
    top: 50 + (((row + 0.5) / AMBIENT_GRID.rows) * 100 - 50) * REACH,
  }));

/**
 * The glow behind the picture: a ring of soft orbs of light around its edge, each the colour of the
 * part of the picture nearest it. They follow the film several times a second and ease between
 * colours rather than jumping, so light moving across the picture moves across the room with it.
 *
 * Reads the picture itself rather than being handed its colours, so the player around it is not
 * redrawn on every look.
 *
 * @param videoRef - The video whose picture the glow follows.
 */
const AmbientOrbs = ({ videoRef }: AmbientOrbsProps) => {
  const lights = useAmbientLights(videoRef, true);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {EDGE.map(({ cell, left, top }) => (
        <span
          key={cell}
          className="absolute size-[36vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[4.5rem] transition-[background-color] duration-[120ms] ease-linear motion-reduce:transition-none"
          style={{
            left: `${left.toString()}%`,
            top: `${top.toString()}%`,
            backgroundColor: lights[cell] ?? 'transparent',
          }}
        />
      ))}
    </div>
  );
};

AmbientOrbs.displayName = 'AmbientOrbs';

export { AmbientOrbs };
