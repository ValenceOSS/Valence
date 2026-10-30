import type { LatestRelease } from '@ValenceLanding/content/downloads/latestRelease';
import type { Platform } from '@ValenceLanding/content/downloads/Platform';

type DownloadDesktopProps = {
  release: LatestRelease | null;
  platform: Platform;
  isArm: boolean;
};

export type { DownloadDesktopProps };
