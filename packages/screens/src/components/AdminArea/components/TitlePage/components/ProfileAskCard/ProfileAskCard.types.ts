import type { ProfileAsk } from '@ValenceContracts/schemas/MediaRequest';

type ProfileAskCardProps = {
  ask: ProfileAsk;
  currentName: string | null;
  isBusy: boolean;
  onDecide: (choice: 'switch' | 'keep') => void;
};

export type { ProfileAskCardProps };
