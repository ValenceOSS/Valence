import type { AMenuItem } from '@ValenceMobile/components/AMenu/AMenu.types';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ASplitPart = {
  icon: AGlyph;
  label: string;
  onPress?: () => void;
  menu?: { title: string; items: readonly AMenuItem[] };
  isChosen?: boolean;
  isDisabled?: boolean;
  tone?: 'bold' | 'danger';
};

type ASplitButtonProps = {
  parts: readonly ASplitPart[];
};

export type { ASplitButtonProps, ASplitPart };
