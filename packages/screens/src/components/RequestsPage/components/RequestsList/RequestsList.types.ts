import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type RequestsListProps = {
  onAsk: (asking: string) => void;
  onOpen: (kind: MediaRequestKind, mediaId: string) => void;
};

export type { RequestsListProps };
