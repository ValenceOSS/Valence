import type { Statistics } from '@ValenceContracts/schemas/Statistics';

type PlaybackModeShareProps = {
  modes: Statistics['modes'];
  reasons?: Statistics['reasons'];
};

export type { PlaybackModeShareProps };
