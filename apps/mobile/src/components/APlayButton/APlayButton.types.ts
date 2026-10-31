import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type AnAside = {
  icon: AGlyph;
  label: string;
  onPress: () => void;
};

type APlayButtonProps = {
  says: string;
  onPress?: () => void;
  icon?: AGlyph;
  isBusy?: boolean;
  isDisabled?: boolean;
  dropsAMenu?: boolean;
  watched?: number | null;
  onStartAgain?: () => void;
  aside?: AnAside;
};

export type { AnAside, APlayButtonProps };
