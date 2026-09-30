import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import type { StatsSecondsProps } from './StatsSeconds.types';

/**
 * A number of seconds for the statistics panel, to one decimal place — buffer and encode figures
 * move constantly, and more digits than that read as noise rather than as detail.
 *
 * @param value - The number of seconds.
 */
const StatsSeconds = ({ value }: StatsSecondsProps) => (
  <AnimatedNumber
    value={value}
    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
    suffix="s"
  />
);

StatsSeconds.displayName = 'StatsSeconds';

export { StatsSeconds };
