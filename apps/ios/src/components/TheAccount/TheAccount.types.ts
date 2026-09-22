import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';

type TheAccountProps = {
  onOut: () => void;
  onWatchHeld: (file: HeldFile) => void;
};

export type { TheAccountProps };
