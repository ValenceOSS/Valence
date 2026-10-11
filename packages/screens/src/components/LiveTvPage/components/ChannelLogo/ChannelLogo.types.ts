import type { LiveHealth } from '@ValenceContracts/schemas/LiveTv';

type ChannelLogoProps = {
  channelId: string;
  name: string;
  hasLogo: boolean;
  health?: LiveHealth | null;
  className?: string;
};

export type { ChannelLogoProps };
