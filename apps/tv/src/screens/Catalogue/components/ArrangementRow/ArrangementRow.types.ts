import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';

type ArrangementRowProps = {
  arrangement: Arrangement;
  onArrange: (arrangement: Arrangement) => void;
  onFocus: () => void;
};

export type { ArrangementRowProps };
