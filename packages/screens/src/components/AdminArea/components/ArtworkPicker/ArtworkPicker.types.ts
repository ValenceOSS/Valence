type ArtworkSubject = {
  mediaId: string;
  name: string;
  isSeries: boolean;
  mediaIds: readonly string[];
};

type ArtworkPickerProps = {
  subject: ArtworkSubject | null;
  onClose: () => void;
  onChanged: (jobId: string | null) => void;
};

export type { ArtworkPickerProps, ArtworkSubject };
