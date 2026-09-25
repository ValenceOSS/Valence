import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import type { Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Stat } from '@ValenceScreens/components/AdminArea/components/StatStrip/StatStrip.types';
import { say } from '@ValenceI18n/say';

/**
 * Decides what the graphics tile says, and is careful about what it refuses to say. Cards report
 * either encoder use or whole-device use and rarely both, and the two are not the same number, so
 * whichever is available is labelled as what it is rather than passed off as the other. A figure
 * the kernel would only attribute to Valence's own work says so too, because a quiet card and a
 * busy one Valence is not using look identical from there.
 *
 * @param graphics - What the monitor read from the card, or null where there is nothing readable.
 * @param notes - Why nothing was read, where the media service said, so the tile can point at them.
 * @returns The figure, how full the bar should be, and what the figure actually measures.
 */
const describeGraphics = (
  graphics: Monitor['resources']['graphics'],
  notes: readonly string[] = [],
): Omit<Stat, 'label' | 'detail'> & { detail: string } => {
  if (graphics === null) {
    return {
      value: '—',
      detail:
        notes.length === 0
          ? say('admin.describeGraphics.noCard')
          : say('admin.describeGraphics.hoverForWhy'),
    };
  }

  if (graphics.encoderPercent !== null) {
    return {
      value: <AnimatedNumber value={Math.round(graphics.encoderPercent)} suffix="%" />,
      fraction: graphics.encoderPercent / 100,
      detail:
        graphics.measured === 'valenceOnly'
          ? say('admin.describeGraphics.oursOnly')
          : say('admin.describeGraphics.encoderOnly'),
    };
  }

  if (graphics.devicePercent !== null) {
    return {
      value: <AnimatedNumber value={Math.round(graphics.devicePercent)} suffix="%" />,
      fraction: graphics.devicePercent / 100,
      detail: say('admin.describeGraphics.wholeCard'),
    };
  }

  return {
    value: '—',
    detail:
      notes.length === 0
        ? say('admin.describeGraphics.nothingReadable')
        : say('admin.describeGraphics.hoverForWhy'),
  };
};

export { describeGraphics };
