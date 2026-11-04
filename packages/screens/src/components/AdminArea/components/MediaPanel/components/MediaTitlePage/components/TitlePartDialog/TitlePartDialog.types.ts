type OpenPart = {
  scope: 'season' | 'episode';
  mediaId: string;
  title: string;
  detail: string | null;
  path: string | null;
};

type TitlePartDialogProps = {
  part: OpenPart | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
};

export type { OpenPart, TitlePartDialogProps };
