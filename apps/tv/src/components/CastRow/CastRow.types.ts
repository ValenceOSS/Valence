import type { CastMember } from '@ValenceContracts/schemas/Library';

type CastRowProps = {
  cast: readonly CastMember[];
  onOpen: (personId: number) => void;
};

export type { CastRowProps };
