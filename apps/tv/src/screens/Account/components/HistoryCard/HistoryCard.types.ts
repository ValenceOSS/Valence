import type { Viewing } from '@ValenceContracts/schemas/Viewing';

type HistoryCardProps = {
  viewing: Viewing;
  onPress: (viewing: Viewing) => void;
  onFocus: (viewing: Viewing) => void;
};

export type { HistoryCardProps };
