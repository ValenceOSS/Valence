type BadgesProps = {
  badges: readonly string[];
  rating?: { certification: string; region: string } | null;
  isSolid?: boolean;
};

export type { BadgesProps };
