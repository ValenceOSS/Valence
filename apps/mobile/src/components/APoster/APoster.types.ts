type APosterProps = {
  title: string;
  year?: number | null;
  artwork: string | null;
  watched?: number;
  note?: string | null;
  count?: number;
  wide?: number;
  isStill?: boolean;
  detail?: string | null;
  origin?: { initial: string; colour: string; label: string } | null;
};

export type { APosterProps };
