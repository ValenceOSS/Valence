import type { ReactNode } from 'react';
import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type SplitButtonTone = 'confirm' | 'secondary';

type SplitButtonProps = {
  children: ReactNode;
  onClick: () => void;
  choiceLabel: string;
  choiceName: string;
  options: MenuOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  tone?: SplitButtonTone;
  size?: 'sm' | 'lg';
  footer?: ReactNode;
  className?: string;
};

export type { SplitButtonProps, SplitButtonTone };
