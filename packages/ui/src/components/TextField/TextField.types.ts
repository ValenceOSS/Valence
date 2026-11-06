import type { HTMLInputAutoCompleteAttribute, KeyboardEvent, ReactNode, Ref } from 'react';

type TextFieldType = 'text' | 'email' | 'password' | 'url' | 'search' | 'number' | 'time' | 'date';

type TextFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  type?: TextFieldType;
  description?: string;
  descriptionPlacement?: 'above' | 'below';
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  isPill?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isBare?: boolean;
  isInset?: boolean;
  isLabelHidden?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
  unit?: string;
  inside?: ReactNode;
  joins?: 'next';
  hasFocusOnMount?: boolean;
  ref?: Ref<HTMLInputElement>;
  rows?: number;
  isGrowing?: boolean;
  isCode?: boolean;
  areaRef?: Ref<HTMLTextAreaElement>;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'url' | 'search' | 'tel';
  className?: string;
};

export type { TextFieldProps };
