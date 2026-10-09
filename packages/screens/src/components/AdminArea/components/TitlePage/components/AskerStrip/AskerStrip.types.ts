import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type AskerStripProps = {
  request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy' | 'createdAt'>;
};

export type { AskerStripProps };
