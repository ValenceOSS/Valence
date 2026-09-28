import type { IconGlyph } from '@ValenceUI/Icon.types';

type PlaylistCoverProps = {
  name: string;
  albumIds: readonly string[];
  artwork?: string | null;
  standIn?: IconGlyph;
  iconSize?: number;
  className?: string;
};

export type { PlaylistCoverProps };
