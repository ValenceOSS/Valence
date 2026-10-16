import type { MediaRequest, Narration, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

type BookFormatsProps = {
  items: readonly RequestItem[];
  approval: MediaRequest['approval'];
  narrations: readonly Narration[];
};

export type { BookFormatsProps };
