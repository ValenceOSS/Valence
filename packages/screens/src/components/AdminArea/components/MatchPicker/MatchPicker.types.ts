import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type MatchPickerProps = {
  media: MediaSummary | null;
  isInShows?: boolean;
  onClose: () => void;
  onCorrected: (jobId: string | null) => void;
};

export type { MatchPickerProps };
