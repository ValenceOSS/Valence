type LeaveOutTarget = {
  libraryId: string;
  libraryPath: string;
  path: string;
  name: string;
  isFolder: boolean;
};

type LeaveOutDialogProps = {
  target: LeaveOutTarget | null;
  onClose: () => void;
};

export type { LeaveOutDialogProps, LeaveOutTarget };
