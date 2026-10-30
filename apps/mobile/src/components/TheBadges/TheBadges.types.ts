type TheBadgesProps = {
  badges: readonly string[];
  isOnArtwork?: boolean;
  isShort?: boolean;
  isLarge?: boolean;
  isSolid?: boolean;
  rating?: { certification: string; region: string } | null;
};

export type { TheBadgesProps };
