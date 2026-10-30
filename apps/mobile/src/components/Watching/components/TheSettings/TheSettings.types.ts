import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ASetting = {
  icon: AGlyph;
  label: string;
  value?: string;
  onPress: () => void;
};

type TheSettingsProps = {
  settings: readonly ASetting[];
  onClose: () => void;
};

export type { ASetting, TheSettingsProps };
