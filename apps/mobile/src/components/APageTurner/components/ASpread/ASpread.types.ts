type ASpreadProps = {
  leaves: readonly (string | null)[];
  fit: 'both' | 'width' | 'height';
  breadth: number;
  tall: number;
  isRightToLeft: boolean;
  onTap: (pageX: number) => void;
  onZoomed: (isZoomed: boolean) => void;
};

export type { ASpreadProps };
