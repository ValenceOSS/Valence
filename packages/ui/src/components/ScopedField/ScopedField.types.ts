import type { HTMLInputAutoCompleteAttribute } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type ScopedChoice = {
  label: string;
  options: MenuOption[];
  value: string;
  onChange: (value: string) => void;
};

type ScopedSubmit = {
  label: string;
  icon: IconGlyph;
  isDisabled?: boolean;
  isBusy?: boolean;
};

type ScopedFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  choices?: readonly ScopedChoice[];
  submit?: ScopedSubmit;
  size?: 'md' | 'lg';
  placeholder?: string;
  type?: 'search' | 'text' | 'password';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  description?: string;
  isLabelHidden?: boolean;
  hasFocusOnMount?: boolean;
  className?: string;
};

export type { ScopedChoice, ScopedFieldProps, ScopedSubmit };
