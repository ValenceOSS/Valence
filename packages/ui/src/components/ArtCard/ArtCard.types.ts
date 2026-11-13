type ArtCardProps = {
  title: string;
  imageUrl?: string;
  logoUrl?: string;
  flag?: string;
  watchedFraction?: number;
  onSelect: () => void;
  href?: string;
  isStill?: boolean;
  isLazy?: boolean;
  className?: string;
};

export type { ArtCardProps };
