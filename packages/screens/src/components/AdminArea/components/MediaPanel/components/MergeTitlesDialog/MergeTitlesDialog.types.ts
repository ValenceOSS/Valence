type MergeFilm = { mediaId: string; name: string; year: number | null; externalId: string | null };

type MergeTitlesDialogProps = {
  films: readonly MergeFilm[] | null;
  onClose: () => void;
  onMerged: () => void;
};

export type { MergeFilm, MergeTitlesDialogProps };
