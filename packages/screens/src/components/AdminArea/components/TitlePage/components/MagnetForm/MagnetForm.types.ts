import type { MediaRequest, SearchScope } from '@ValenceContracts/schemas/MediaRequest';

type MagnetFormProps = {
  request: Pick<MediaRequest, 'id' | 'title' | 'year' | 'kind'>;
  scope: SearchScope | null;
  onPicked: (picked: MediaRequest) => void;
};

export type { MagnetFormProps };
