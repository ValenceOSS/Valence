import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestRowProps = {
  request: MediaRequest;
  going: RequestProgress | null;
  isSomeoneElses: boolean;
  hasPreferredFocus: boolean;
  onPress: (request: MediaRequest) => void;
};

export type { RequestRowProps };
