type ListeningProps = {
  onEmpty: () => void;
  onBack: () => void;
};

type ListeningPanel = 'speed' | 'sleep' | 'chapters';

export type { ListeningPanel, ListeningProps };
