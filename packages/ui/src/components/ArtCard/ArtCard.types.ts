type ArtCardProps = {
  title: string;
  imageUrl?: string;
  logoUrl?: string;
  flag?: string;
  watchedFraction?: number;
  onSelect: () => void;
  href?: string;
  className?: string;
};

export type { ArtCardProps };
