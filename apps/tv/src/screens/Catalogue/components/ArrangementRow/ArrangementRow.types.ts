import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';

type ArrangementRowProps = {
  arrangement: Arrangement;
  onArrange: (arrangement: Arrangement) => void;
  onFocus: () => void;
  isFiltered: boolean;
  onFilters: () => void;
};

export type { ArrangementRowProps };
