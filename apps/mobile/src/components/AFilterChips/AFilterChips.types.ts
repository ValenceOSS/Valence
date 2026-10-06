type AFilterChip = { id: string; label: string };

type AFilterChipsProps = {
  label: string;
  chips: readonly AFilterChip[];
  value: string;
  onSelect: (id: string) => void;
};

export type { AFilterChip, AFilterChipsProps };
