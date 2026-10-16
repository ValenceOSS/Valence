import type { CoreGroup } from '@ValenceContracts/schemas/Hardware';

type CoreMapProps = {
  cores: number | null;
  threads: number;
  groups: readonly CoreGroup[];
  percents: readonly number[];
};

export type { CoreMapProps };
