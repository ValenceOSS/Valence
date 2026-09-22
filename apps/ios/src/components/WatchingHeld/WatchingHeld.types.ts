import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';

type WatchingHeldProps = {
  file: HeldFile;
  onDone: () => void;
};

export type { WatchingHeldProps };
