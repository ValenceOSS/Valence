type EpisodeNumberDialogProps = {
  mediaId: string;
  season: number;
  episode: number;
  isOpen: boolean;
  onClose: () => void;
  onChanged: (jobId: string | null) => void;
};

export type { EpisodeNumberDialogProps };
