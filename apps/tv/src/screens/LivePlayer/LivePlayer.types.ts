type LivePlayerProps = {
  channelId: string;
  onLeave: (channelId: string) => void;
  onShowing: (channelId: string) => void;
};

export type { LivePlayerProps };
