type AMissingSongProps = {
  title: string;
  artist: string;
  hasCover: boolean;
  coverUrl: string | null;
  onChoose?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
};

export type { AMissingSongProps };
