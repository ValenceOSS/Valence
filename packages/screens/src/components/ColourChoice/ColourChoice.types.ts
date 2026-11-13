type ColourChoiceProps = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: readonly string[];
  clear?: { isChosen: boolean; onChoose: () => void };
  isCompact?: boolean;
  className?: string;
};

export type { ColourChoiceProps };
