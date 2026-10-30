import type { Requester } from '@ValenceContracts/schemas/MediaRequest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ARequesterFacesProps = {
  askers: readonly Requester[];
  faces: readonly ViewerProfile[];
  ring: string;
};

export type { ARequesterFacesProps };
