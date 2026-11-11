import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';

type APersonTimelineProps = {
  credits: readonly PersonCredit[];
  onAsk?: (kind: MediaRequestKind, id: string) => void;
};

export type { APersonTimelineProps };
