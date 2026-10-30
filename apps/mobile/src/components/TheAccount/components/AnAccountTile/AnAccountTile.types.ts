import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AnAccountTileProps = {
  icon: AGlyph;
  says: string;
  figure: number;
  isNews?: boolean;
  onPress: () => void;
};

export type { AnAccountTileProps };
