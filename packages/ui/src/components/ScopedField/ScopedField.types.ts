import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type ScopedChoice = {
  label: string;
  options: MenuOption[];
  value: string;
  onChange: (value: string) => void;
};

type ScopedFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  choices: readonly ScopedChoice[];
  placeholder?: string;
  isLabelHidden?: boolean;
  hasFocusOnMount?: boolean;
  className?: string;
};

export type { ScopedChoice, ScopedFieldProps };
