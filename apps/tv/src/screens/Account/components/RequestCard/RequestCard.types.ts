import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestCardProps = {
  request: MediaRequest;
  going: RequestProgress | null;
  onPress: (request: MediaRequest) => void;
  onFocus: () => void;
};

export type { RequestCardProps };
