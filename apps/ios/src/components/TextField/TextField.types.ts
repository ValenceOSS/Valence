type TextFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isSecret?: boolean;
  keyboard?: 'default' | 'url' | 'search' | 'code';
  onSubmit?: () => void;
};

export type { TextFieldProps };
