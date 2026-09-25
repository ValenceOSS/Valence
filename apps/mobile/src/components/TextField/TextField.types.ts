import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type TextFieldAction = {
  icon: AGlyph;
  label: string;
  onPress: () => void;
};

type TextFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isSecret?: boolean;
  keyboard?: 'default' | 'url' | 'search' | 'code';
  onSubmit?: () => void;
  action?: TextFieldAction;
  isBare?: boolean;
};

export type { TextFieldAction, TextFieldProps };
