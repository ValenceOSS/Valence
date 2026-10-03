type WherePanelProps = {
  options: readonly { id: string; label: string }[];
  chosen: string;
  onChoose: (id: string) => void;
  onClose: () => void;
};

export type { WherePanelProps };
