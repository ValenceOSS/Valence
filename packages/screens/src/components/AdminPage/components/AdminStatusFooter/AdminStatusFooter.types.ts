import type { Acceleration } from '@ValenceScreens/components/AdminArea/describeAcceleration';

type AdminStatusFooterProps = {
  version: string | null;
  acceleration: Acceleration | null;
  ffmpeg: string | null;
  latest: string | null;
  onOpenUpdates: () => void;
};

export type { AdminStatusFooterProps };
