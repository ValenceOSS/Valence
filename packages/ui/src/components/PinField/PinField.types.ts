type PinFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  description?: string;
  error?: string;
  isNew?: boolean;
  hasFocusOnMount?: boolean;
  className?: string;
};

export type { PinFieldProps };
