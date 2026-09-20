import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestReleasesTabProps = {
  request: MediaRequest;
  onPicked: (request: MediaRequest) => void;
};

export type { RequestReleasesTabProps };
