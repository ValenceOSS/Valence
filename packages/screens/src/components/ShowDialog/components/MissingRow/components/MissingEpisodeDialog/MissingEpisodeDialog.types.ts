import type { CastMember } from '@ValenceScreens/components/CastGrid/CastGrid.types';

type MissingEpisodeDialogProps = {
  isOpen: boolean;
  showTitle: string;
  title: string;
  episodeNumber: number;
  seasonNumber?: number | null | undefined;
  airs?: string | undefined;
  stillUrl?: string | null | undefined;
  overview?: string | null | undefined;
  logoMediaId?: string | null | undefined;
  castMediaId?: string | null | undefined;
  genres?: readonly string[] | undefined;
  onOpenPerson?: ((member: CastMember) => void) | undefined;
  onRequest?: (() => void) | undefined;
  onClose: () => void;
};

export type { MissingEpisodeDialogProps };
