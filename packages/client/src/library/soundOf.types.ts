import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

type AudioStreamFacts = Pick<
  MediaItem['audioStreams'][number],
  'codec' | 'channels' | 'isAtmos'
> & {
  profile?: string | null | undefined;
};

type Sound = { format: string | null; channels: string | null };

export type { AudioStreamFacts, Sound };
