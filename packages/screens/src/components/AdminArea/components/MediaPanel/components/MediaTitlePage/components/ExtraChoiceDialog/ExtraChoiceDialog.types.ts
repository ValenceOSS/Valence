type ExtraChoiceDialogProps = {
  file: { mediaId: string; name: string; isExtra: boolean } | null;
  title: { mediaId: string; name: string };
  onClose: () => void;
  onChanged: (jobId: string | null) => void;
};

export type { ExtraChoiceDialogProps };
