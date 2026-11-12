type ReaderContentsEntry = { id: string; label: string; detail?: string; depth?: number };

type ReaderContentsProps = {
  label: string;
  entries: readonly ReaderContentsEntry[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
};

export type { ReaderContentsEntry, ReaderContentsProps };
