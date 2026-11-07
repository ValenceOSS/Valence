import type { Acceleration } from '@ValenceScreens/components/AdminArea/describeAcceleration';

type AdminStatusFooterProps = {
  version: string | null;
  acceleration: Acceleration | null;
  ffmpeg: string | null;
  latest: string | null;
  isLatestADevBuild?: boolean;
  onOpenUpdates: () => void;
  isInHeader?: boolean;
  isPillOnly?: boolean;
};

export type { AdminStatusFooterProps };
