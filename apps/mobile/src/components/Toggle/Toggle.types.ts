type ToggleProps = {
  label: string;
  isOn: boolean;
  onToggle: (isOn: boolean) => void;
  isDisabled?: boolean;
};

export type { ToggleProps };
