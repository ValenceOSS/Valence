type DiscoverPointerProps = {
  query: string;
  isAlone: boolean;
  onAsk: (asking: string) => void;
  onDiscover: (query: string) => void;
};

export type { DiscoverPointerProps };
