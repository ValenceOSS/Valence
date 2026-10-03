import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type SelectFieldProps = {
  label: string;
  options: MenuOption[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md';
  isLabelHidden?: boolean;
  className?: string;
};

export type { SelectFieldProps };
