import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type APlayButtonProps = {
  says: string;
  onPress?: () => void;
  icon?: AGlyph;
  isBusy?: boolean;
  isDisabled?: boolean;
  watched?: number | null;
  onStartAgain?: () => void;
};

export type { APlayButtonProps };
