import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';

type ArrangementRowProps = {
  arrangement: Arrangement;
  onArrange: (arrangement: Arrangement) => void;
  onFocus: () => void;
  isFiltered: boolean;
  onFilters: () => void;
  where?: { label: string; onPress: () => void };
};

export type { ArrangementRowProps };
