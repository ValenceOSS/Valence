import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type AskedProps = {
  onAsk: (kind: MediaRequestKind, id: string) => void;
};

export type { AskedProps };
