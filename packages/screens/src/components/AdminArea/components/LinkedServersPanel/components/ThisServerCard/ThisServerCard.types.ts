import type { LinkIdentity } from '@ValenceContracts/schemas/LinkedServer';

type ThisServerCardProps = {
  identity: LinkIdentity;
};

type PictureChange = { kind: 'kept' } | { kind: 'new'; file: File } | { kind: 'removed' };

export type { PictureChange, ThisServerCardProps };
