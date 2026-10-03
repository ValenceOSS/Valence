import type { MediaCardOrigin } from '@ValenceUI/MediaCard.types';

type MusicArtworkProps = {
  src: string | null;
  label: string;
  shape?: 'square' | 'round';
  isLifted?: boolean;
  travelsAs?: string;
  origin?: MediaCardOrigin;
  className?: string;
};

export type { MusicArtworkProps };
