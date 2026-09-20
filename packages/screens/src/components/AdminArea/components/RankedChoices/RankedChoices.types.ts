type RankedChoicesProps<Choice extends string> = {
  label: string;
  options: readonly { id: Choice; label: string }[];
  chosen: readonly Choice[];
  onChange: (chosen: Choice[]) => void;
};

export type { RankedChoicesProps };
