type ReleaseSearchDialogProps = {
  title: string | null;
  detail: string;
  onClose: () => void;
  indexerIds?: readonly string[];
  profileId?: string | null;
  query?: string;
};

export type { ReleaseSearchDialogProps };
