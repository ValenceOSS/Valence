import type { MediaRequest, SearchScope } from '@ValenceContracts/schemas/MediaRequest';

type RequestReleasesTabProps = {
  request: MediaRequest;
  scope?: SearchScope | null;
  onPicked: (request: MediaRequest) => void;
};

export type { RequestReleasesTabProps };
