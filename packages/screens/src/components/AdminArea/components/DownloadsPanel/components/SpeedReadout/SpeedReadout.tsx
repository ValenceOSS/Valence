import { speedsOf } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/speedsOf';
import type { SpeedReadoutProps } from './SpeedReadout.types';

/**
 * How fast something is coming down and going up, in a table's cell: each direction on a line of
 * its own, so neither is ever split between two, and a dash where neither is known.
 *
 * @param down - Bytes a second coming down, where known.
 * @param up - Bytes a second going up, where known.
 */
const SpeedReadout = ({ down, up }: SpeedReadoutProps) => {
  const speeds = speedsOf(down, up);

  return (
    <span className="flex flex-col whitespace-nowrap text-xs tabular-nums text-text-muted">
      {speeds.length === 0 ? '—' : speeds.map((speed) => <span key={speed}>{speed}</span>)}
    </span>
  );
};

SpeedReadout.displayName = 'SpeedReadout';

export { SpeedReadout };
