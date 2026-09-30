import type { IsometricStageProps } from './IsometricStage.types';

/**
 * Sets a piece of the product at a gentle angle, turned slightly away and leaning back, with a thin
 * edge and a soft shadow beneath, so it reads as an object resting on the page rather than a flat
 * picture while its words stay level and easy to read. Pointed at, the card it belongs to eases it
 * flat and lifts it a little, on a spring that overshoots slightly. On a phone it lies flat, and for
 * somebody who asked for less motion it holds still.
 *
 * @param children - What to set on the plane.
 */
const IsometricStage = ({ children }: IsometricStageProps) => (
  <span data-slot="isometric-stage" className="valence-iso">
    <span className="valence-iso__plane">{children}</span>
  </span>
);

IsometricStage.displayName = 'IsometricStage';

export { IsometricStage };
