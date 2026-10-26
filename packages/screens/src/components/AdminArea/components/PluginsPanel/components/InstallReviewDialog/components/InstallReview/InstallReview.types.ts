import type { InstallPreview } from '@ValenceContracts/schemas/Plugin';

type InstallReviewProps = {
  preview: InstallPreview;
  isUnderstood: boolean;
  onUnderstood: (isUnderstood: boolean) => void;
  isInstalling: boolean;
  onCancel: () => void;
  onInstall: () => void;
};

export type { InstallReviewProps };
