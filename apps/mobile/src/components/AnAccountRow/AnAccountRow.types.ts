import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AnAccountRowProps = {
  icon: AGlyph;
  says: string;
  detail?: string;
  tint?: string;
  count?: number;
  onPress: () => void;
};

export type { AnAccountRowProps };
