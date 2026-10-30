import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type ASplitPart = {
  icon: AGlyph;
  label: string;
  onPress: () => void;
  isChosen?: boolean;
  tone?: 'bold' | 'danger';
};

type ASplitButtonProps = {
  parts: readonly ASplitPart[];
};

export type { ASplitButtonProps, ASplitPart };
