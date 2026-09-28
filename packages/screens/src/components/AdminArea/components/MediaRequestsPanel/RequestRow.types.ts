import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

type RequestRow =
  | { kind: 'request'; id: string; request: MediaRequest }
  | { kind: 'season'; id: string; request: MediaRequest; season: number; items: RequestItem[] }
  | { kind: 'item'; id: string; request: MediaRequest; item: RequestItem };

export type { RequestRow };
