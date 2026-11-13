import type { StringKey } from '@ValenceI18n/StringKey';

type AColourSwatchesProps = {
  value: string;
  options: readonly string[];
  onChoose: (colour: string) => void;
  clear?: { isChosen: boolean; onChoose: () => void };
  gradients?: {
    options: readonly { from: string; to: string; name: StringKey }[];
    chosen: { from: string; to: string } | null;
    onChoose: (from: string, to: string) => void;
  };
};

export type { AColourSwatchesProps };
