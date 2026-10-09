import { useQueries, useQuery } from '@tanstack/react-query';
import {
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenFilledIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { InfoRow } from '@ValenceUI/InfoRow';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { FolderMeasure } from '@ValenceContracts/schemas/LibraryFiles';
import type { FileDetailsProps } from './FileDetails.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * How much something takes on the disk, as far as it is known: a folder still being added up says
 * so, and one too large to count at once says it holds at least that much.
 *
 * @param measure - What a folder holds, or nothing while it is being added up.
 * @returns The size to show.
 */
const sizeOf = (measure: FolderMeasure | undefined): string =>
  measure === undefined
    ? say('screens.adminArea.fileDetails.addingUp')
    : measure.isPartial
      ? say('screens.adminArea.fileDetails.atLeastSize', { size: formatBytes(measure.sizeBytes) })
      : formatBytes(measure.sizeBytes);

/**
 * The side of the file manager that says what is chosen in it: the folder open where nothing is,
 * with how much it takes on the disk and how many files and folders it holds all the way down; one
 * file or folder with everything known of it; or how many are chosen and how much they take
 * together.
 *
 * @param where - The folder open, what it is called and how many things are in it, or nothing.
 * @param selected - What is chosen.
 * @param shownPath - Writes a path as it is shown, from inside its library.
 * @param onClear - Chooses nothing.
 */
const FileDetails = ({
  where,
  selected,
  shownPath,
  onClear,
}: FileDetailsProps) => {
  const only = selected.length === 1 ? (selected[0] ?? null) : null;
  const measuredPath =
    only === null
      ? selected.length === 0
        ? (where?.path ?? null)
        : null
      : only.isFolder
        ? only.path
        : null;
  const measured = useQuery(adminQueries.folderMeasure(measuredPath));
  const folders = selected.length > 1 ? selected.filter((entry) => entry.isFolder) : [];
  const folderMeasures = useQueries({
    queries: folders.map((entry) => adminQueries.folderMeasure(entry.path)),
  });
  const together = folderMeasures.some((one) => one.data === undefined)
    ? undefined
    : {
        sizeBytes:
          selected.reduce((sum, entry) => sum + (entry.sizeBytes ?? 0), 0) +
          folderMeasures.reduce((sum, one) => sum + (one.data?.sizeBytes ?? 0), 0),
        files:
          selected.filter((entry) => !entry.isFolder).length +
          folderMeasures.reduce((sum, one) => sum + (one.data?.files ?? 0), 0),
        folders:
          folders.length + folderMeasures.reduce((sum, one) => sum + (one.data?.folders ?? 0), 0),
        isPartial: folderMeasures.some((one) => one.data?.isPartial === true),
      };

  return (
    <aside
      aria-label={say('common.details')}
      className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-[var(--surface-line)] p-4 max-lg:hidden"
    >
      {only !== null ? (
        <>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)]">
              <Icon of={only.isFolder ? FolderIcon : FileIcon} size={20} tone="muted" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="break-words text-sm font-medium text-text">{only.name}</h3>
              <p className="break-all text-xs text-text-muted">{shownPath(only.path)}</p>
            </div>
          </div>

          <div className="flex flex-col">
            <InfoRow label={say('common.size')}>
              {only.isFolder
                ? sizeOf(measured.data)
                : only.sizeBytes === null
                  ? '—'
                  : formatBytes(only.sizeBytes)}
            </InfoRow>
            {only.isFolder && measured.data !== undefined ? (
              <InfoRow label={say('common.holds')}>
                {sayCount('common.count.files', measured.data.files)} ·{' '}
                {sayCount('screens.adminArea.fileDetails.count.folders', measured.data.folders)}
              </InfoRow>
            ) : null}
            <InfoRow label={say('screens.adminArea.filesPanel.changed')}>
              {only.modifiedAt === null ? '—' : new Date(only.modifiedAt).toLocaleString()}
            </InfoRow>
            {only.mediaId === null ? null : (
              <InfoRow label={say('common.valence')}>
                <Badge size="sm" tone="success">
                  {say('screens.adminArea.filesPanel.inTheCatalogue')}
                </Badge>
              </InfoRow>
            )}
          </div>
        </>
      ) : selected.length > 1 ? (
        <>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-medium text-text">
              {sayCount('screens.adminArea.fileDetails.count.selected', selected.length)}
            </h3>
            <Button variant="link" size="none" className="self-start text-xs" onClick={onClear}>
              {say('screens.adminArea.downloadsPanel.untickThem')}
            </Button>
          </div>

          <div className="flex flex-col">
            <InfoRow label={say('screens.adminArea.fileDetails.together')}>
              {sizeOf(together)}
            </InfoRow>
            {together === undefined ? null : (
              <InfoRow label={say('common.holds')}>
                {sayCount('common.count.files', together.files)} ·{' '}
                {sayCount('screens.adminArea.fileDetails.count.folders', together.folders)}
              </InfoRow>
            )}
          </div>
        </>
      ) : where === null ? null : (
        <>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)]">
              <Icon of={FolderOpenFilledIcon} size={20} tone="muted" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="break-words text-sm font-medium text-text">{where.name}</h3>
              <p className="text-xs text-text-muted">
                {sayCount('common.count.items', where.holds)}
              </p>
            </div>
          </div>

          {where.path === null ? null : (
            <div className="flex flex-col">
              <InfoRow label={say('common.size')}>{sizeOf(measured.data)}</InfoRow>
              {measured.data === undefined ? null : (
                <InfoRow label={say('common.holds')}>
                  {sayCount('common.count.files', measured.data.files)} ·{' '}
                  {sayCount('screens.adminArea.fileDetails.count.folders', measured.data.folders)}
                </InfoRow>
              )}
            </div>
          )}

          <p className="text-xs text-text-muted">
            {say('screens.adminArea.fileDetails.chooseSomethingToSeeIt')}
          </p>
        </>
      )}

    </aside>
  );
};

FileDetails.displayName = 'FileDetails';

export { FileDetails };
