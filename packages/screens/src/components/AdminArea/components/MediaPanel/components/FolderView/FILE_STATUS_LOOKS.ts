import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { FileStatus } from '@ValenceContracts/schemas/LibraryFiles';
import { say } from '@ValenceI18n/say';

const FILE_STATUS_LOOKS: Readonly<Record<FileStatus, { label: string; tone: BadgeTone }>> = {
  inLibrary: { label: say('common.inTheLibrary'), tone: 'success' },
  unmatched: { label: say('screens.adminArea.mediaPanel.unmatched'), tone: 'warning' },
  extra: { label: say('contracts.schemas.library.extra'), tone: 'quiet' },
  leftOut: { label: say('screens.adminArea.folderView.excluded'), tone: 'quiet' },
  sample: { label: say('contracts.schemas.library.sample'), tone: 'quiet' },
  skipped: { label: say('screens.adminArea.preTranscodingCard.passedOver'), tone: 'quiet' },
  unreadable: { label: say('screens.adminArea.mediaPanel.unreadable'), tone: 'danger' },
  notReadYet: { label: say('screens.adminArea.folderView.notReadYet'), tone: 'quiet' },
  sidecar: { label: say('screens.adminArea.folderView.withItsVideo'), tone: 'quiet' },
  orphaned: { label: say('screens.adminArea.folderView.itsVideoIsGone'), tone: 'warning' },
  notAVideo: { label: say('screens.adminArea.folderView.notAVideo'), tone: 'quiet' },
};

export { FILE_STATUS_LOOKS };
