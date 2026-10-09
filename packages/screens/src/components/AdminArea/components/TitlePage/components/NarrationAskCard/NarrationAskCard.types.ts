import type { Narration } from '@ValenceContracts/schemas/MediaRequest';

type NarrationAskCardProps = {
  title: string;
  narrations: readonly Narration[];
  isBusy: boolean;
  onDecide: (asins: string[]) => void;
};

export type { NarrationAskCardProps };
