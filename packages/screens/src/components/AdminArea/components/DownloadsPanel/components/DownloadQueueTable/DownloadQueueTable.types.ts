import type { ReactNode } from 'react';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { Library } from '@ValenceContracts/schemas/Library';

type DownloadQueueTableProps = {
  downloads: readonly QueuedDownload[];
  libraries: readonly Pick<Library, 'id' | 'name' | 'kind'>[];
  busyId: string | null;
  busyIds?: ReadonlySet<string>;
  chosen?: ReadonlySet<string>;
  onChosenChange?: (chosen: ReadonlySet<string>) => void;
  toolbar?: ReactNode;
  onFile: (download: QueuedDownload, libraryId: string) => void;
  onPause: (download: QueuedDownload) => void;
  onResume: (download: QueuedDownload) => void;
  onRemove: (download: QueuedDownload) => void;
  fillsScreen?: boolean;
};

export type { DownloadQueueTableProps };
