type CheckboxProps = {
  label: string;
  isLabelHidden?: boolean;
  description?: string;
  checked?: boolean;
  isMixed?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export type { CheckboxProps };
