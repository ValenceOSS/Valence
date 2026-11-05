import type { CastMember } from '@ValenceScreens/components/CastGrid/CastGrid.types';

type MissingRowProps = {
  showTitle: string;
  episodeNumber: number;
  title?: string;
  stillUrl?: string | null;
  airs?: string;
  overview?: string | null;
  seasonNumber?: number | null;
  logoMediaId?: string | null;
  castMediaId?: string | null;
  genres?: readonly string[];
  onOpenPerson?: (member: CastMember) => void;
  onRequest?: () => void;
};

export type { MissingRowProps };
