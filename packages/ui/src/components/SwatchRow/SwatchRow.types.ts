type Swatch = {
  id: string;
  label: string;
};

type SwatchRowProps = {
  label: string;
  swatches: readonly Swatch[];
  value: string;
  onSelect: (id: string) => void;
  className?: string;
};

export type { Swatch, SwatchRowProps };
