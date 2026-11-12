import {
  Monitor22k as Monitor2kIcon,
  Monitor24k as Monitor4kIcon,
  Monitor2Hd as MonitorHdIcon,
  Monitor2Sd as MonitorSdIcon,
} from '@keyline-icons/react/fill';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

/**
 * Picks the solid screen marked with a resolution tier — SD, HD, 2K or 4K — for a rung of the quality
 * ladder, so a quality reads at a glance as well as by its number.
 *
 * @param step - The rung.
 * @returns The icon for its tier.
 */
const resolutionIconOf = (step: QualityStepId) => {
  switch (step) {
    case '2160p':
      return Monitor4kIcon;
    case '1440p':
      return Monitor2kIcon;
    case '1080p':
    case '720p':
      return MonitorHdIcon;
    case '480p':
    case '360p':
    case '240p':
    case '144p':
      return MonitorSdIcon;
  }
};

export { resolutionIconOf };
