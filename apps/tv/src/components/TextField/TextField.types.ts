type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSecret?: boolean;
  placeholder?: string;
  hasPreferredFocus?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'url';
};

export type { TextFieldProps };
