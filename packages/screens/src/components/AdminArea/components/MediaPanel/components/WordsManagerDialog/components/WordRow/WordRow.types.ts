type WordRowProps = {
  word: string;
  count: number;
  isBusy: boolean;
  onRename: (next: string) => void;
  onRemove: () => void;
};

export type { WordRowProps };
