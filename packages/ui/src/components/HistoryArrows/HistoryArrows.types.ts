type HistoryArrowsProps = {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  backLabel: string;
  forwardLabel: string;
  backKeys?: readonly string[];
  forwardKeys?: readonly string[];
  className?: string;
};

export type { HistoryArrowsProps };
