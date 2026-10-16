import type { Hardware } from '@ValenceContracts/schemas/Hardware';

type ProcessorInfoProps = {
  hardware: Hardware;
  percents: readonly number[];
  speedsMhz: readonly number[];
};

export type { ProcessorInfoProps };
