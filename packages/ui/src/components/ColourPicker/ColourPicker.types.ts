type ColourPickerProps = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: readonly string[];
  className?: string;
};

export type { ColourPickerProps };
