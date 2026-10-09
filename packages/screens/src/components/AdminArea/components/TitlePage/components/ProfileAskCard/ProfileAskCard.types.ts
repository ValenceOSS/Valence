import type { ProfileAsk } from '@ValenceContracts/schemas/MediaRequest';

type ProfileAskCardProps = {
  ask: ProfileAsk;
  currentName: string | null;
  isBusy: boolean;
  canKeepBoth: boolean;
  onDecide: (choice: 'switch' | 'keep' | 'both') => void;
};

export type { ProfileAskCardProps };
