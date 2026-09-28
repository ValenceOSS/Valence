import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AMusicTileProps = {
  title: string;
  detail?: string | null;
  artwork: string | null;
  albumIds?: readonly string[];
  isRound?: boolean;
  side?: number;
  standIn?: AGlyph;
  onPress: () => void;
  onLongPress?: () => void;
};

export type { AMusicTileProps };
