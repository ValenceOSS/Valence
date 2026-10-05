import type { DuskProps } from './Dusk.types';

const SKY = 'absolute inset-0 bg-linear-to-b from-accent/70 via-danger/50 to-highlight';

const HILLS =
  'absolute inset-x-0 bottom-[22%] h-[34%] bg-shade/85 [clip-path:polygon(0_70%,12%_40%,24%_58%,38%_18%,52%_52%,66%_30%,80%_56%,92%_36%,100%_48%,100%_100%,0_100%)]';

const GROUND = 'absolute inset-x-0 bottom-0 h-[26%] bg-shade';

const SUN = 'absolute left-[54%] top-[30%] aspect-square h-[28%] rounded-full bg-on-scrim';

/**
 * One scene at dusk with its highlights clipped flat on one side and kept on the other, the line
 * between them sweeping across and back while the kept sun glows, so the difference is watched
 * rather than read.
 *
 * @param isFlat - Whether to draw the clipped, standard-range version.
 * @param glow - How brightly the sun burns, from nothing to one.
 */
const Dusk = ({ isFlat, glow }: DuskProps) => (
  <span
    className={
      isFlat
        ? 'absolute inset-0 saturate-[0.35] contrast-[0.7] brightness-[1.15]'
        : 'absolute inset-0'
    }
  >
    <span className={SKY} />
    <span
      className={SUN}
      style={{
        boxShadow: isFlat
          ? 'none'
          : `0 0 ${(30 + 30 * glow).toString()}px ${(10 + 14 * glow).toString()}px var(--color-highlight)`,
      }}
    />
    <span className={HILLS} />
    <span className={GROUND} />
  </span>
);

Dusk.displayName = 'Dusk';

export { Dusk };
