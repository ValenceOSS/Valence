type TheAccountProps = {
  onOut: () => void;
  onElsewhere: () => void;
  onOpen: (panel: string) => void;
  onDownloads: () => void;
  onRequests?: () => void;
  onInbox: () => void;
  onBack: () => void;
};

export type { TheAccountProps };
