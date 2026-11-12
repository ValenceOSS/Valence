type DotBarSegment = {
  id: string;
  share: number;
  colour: string;
};

type DotBarProps = {
  segments: readonly DotBarSegment[];
  litId?: string | null;
  label: string;
  onPoint?: (id: string | null) => void;
  className?: string;
};

export type { DotBarProps, DotBarSegment };
