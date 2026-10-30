import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AnAccountTileProps = {
  icon: AGlyph;
  tint: string;
  says: string;
  detail: string;
  count?: number;
  onPress: () => void;
};

export type { AnAccountTileProps };
