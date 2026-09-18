import type { PreviewMoment } from '@ValenceContracts/schemas/Library';

type PreviewMomentPickerProps = {
  mediaId: string;
  title: string;
  durationSeconds: number;
  current: PreviewMoment | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: (moment: PreviewMoment | null) => void;
};

export type { PreviewMomentPickerProps };
