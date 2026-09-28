type TheBadgesProps = {
  badges: readonly string[];
  isOnArtwork?: boolean;
  isShort?: boolean;
  rating?: { certification: string; region: string } | null;
};

export type { TheBadgesProps };
