import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type MyRequestsProps = {
  onAsk: (asking: string) => void;
  onOpen: (kind: MediaRequestKind, mediaId: string) => void;
};

export type { MyRequestsProps };
