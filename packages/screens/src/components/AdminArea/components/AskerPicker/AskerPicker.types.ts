type Asker = {
  id: string;
  name: string;
  detail?: string;
};

type AskerPickerProps = {
  legend: string;
  everyLabel: string;
  askers: readonly Asker[];
  chosen: ReadonlySet<string>;
  onChange: (chosen: ReadonlySet<string>) => void;
};

export type { Asker, AskerPickerProps };
