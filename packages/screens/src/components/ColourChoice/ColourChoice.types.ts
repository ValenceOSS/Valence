type ColourChoiceProps = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: readonly string[];
  isCompact?: boolean;
  className?: string;
};

export type { ColourChoiceProps };
