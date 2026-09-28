type ArtCardProps = {
  title: string;
  imageUrl?: string;
  logoUrl?: string;
  flag?: string;
  watchedFraction?: number;
  onSelect: () => void;
  className?: string;
};

export type { ArtCardProps };
