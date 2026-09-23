import type { LucideIcon } from 'lucide-react-native';

type TextFieldAction = {
  icon: LucideIcon;
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
};

export type { TextFieldAction, TextFieldProps };
