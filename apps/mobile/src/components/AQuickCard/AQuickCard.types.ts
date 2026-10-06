import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AQuickCardProps = {
  title: string;
  artwork: string | null;
  albumIds?: readonly string[];
  isRound?: boolean;
  standIn: AGlyph;
  onPress: () => void;
  onLongPress?: () => void;
};

export type { AQuickCardProps };
