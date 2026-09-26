type AReaderSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isRightToLeft: boolean;
  onRightToLeft: (isRightToLeft: boolean) => void;
  layout: 'one' | 'two' | null;
  onLayout: (layout: 'one' | 'two') => void;
  isCoverAlone: boolean;
  onCoverAlone: (isCoverAlone: boolean) => void;
  chapters: readonly { id: string; label: string; isHere: boolean }[];
  onChapter: (id: string) => void;
};

export type { AReaderSheetProps };
