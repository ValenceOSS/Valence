import type { AGlyph } from '@ValencePhone/components/Icon/Icon.types';

type AMusicTileProps = {
  title: string;
  detail?: string | null;
  artwork: string | null;
  isRound?: boolean;
  side?: number;
  standIn?: AGlyph;
  onPress: () => void;
};

export type { AMusicTileProps };
