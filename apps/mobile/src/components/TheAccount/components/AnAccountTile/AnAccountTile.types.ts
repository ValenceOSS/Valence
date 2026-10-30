import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AnAccountTileProps = {
  icon: AGlyph;
  says: string;
  figure: number | null;
  onPress: () => void;
};

export type { AnAccountTileProps };
