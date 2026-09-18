type ReaderPickerProps = {
  label: string;
  value: string;
  options: { id: string; label: string; detail?: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel: string;
  nextLabel: string;
};

export type { ReaderPickerProps };
