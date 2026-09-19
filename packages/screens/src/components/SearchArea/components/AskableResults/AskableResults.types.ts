import type { SearchKind } from '@ValenceScreens/components/SearchArea/SearchArea.types';

type AskableResultsProps = {
  query: string;
  kind: SearchKind;
  onAsk: (asking: string) => void;
};

export type { AskableResultsProps };
