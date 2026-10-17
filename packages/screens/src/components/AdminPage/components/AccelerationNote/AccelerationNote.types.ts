import type { Acceleration } from '@ValenceScreens/components/AdminArea/describeAcceleration';

type AccelerationNoteProps = {
  acceleration: Acceleration;
  ffmpeg: string | null;
  side?: 'top' | 'bottom';
  align?: 'start' | 'end';
};

export type { AccelerationNoteProps };
