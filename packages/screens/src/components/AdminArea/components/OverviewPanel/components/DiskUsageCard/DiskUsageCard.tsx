import { useState } from 'react';
import {
  BookOpen as BookOpenIcon,
  File as FileIcon,
  Film as FilmIcon,
  HardDrive as HardDriveIcon,
  Layers as LayersIcon,
  MusicNote as MusicIcon,
  Sparkles as SparklesIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/fill';
import { RefreshCw as RefreshIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { DotBar } from '@ValenceUI/DotBar';
import { ScrollFade } from '@ValenceUI/ScrollFade';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { Icon } from '@ValenceUI/Icon';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { measureStorage } from '@ValenceClient/admin/fetchAdmin';
import { driveKeyOf } from '@ValenceScreens/components/AdminArea/driveKeyOf';
import { libraryDisks } from '@ValenceScreens/components/AdminArea/libraryDisks';
import { libraryDrives } from '@ValenceScreens/components/AdminArea/libraryDrives';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { valenceOwnBytes } from '@ValenceScreens/components/AdminArea/valenceOwnBytes';
import { say } from '@ValenceI18n/say';
import { diskShares } from './diskShares';
import type { DiskShare } from './diskShares';
import type { DiskUsageCardProps } from './DiskUsageCard.types';

const COLOURS = {
  movies: 'var(--color-accent)',
  shows: 'var(--color-success)',
  anime: 'var(--color-danger)',
  music: 'var(--color-highlight)',
  books: 'var(--color-busy)',
  valence: 'var(--color-text)',
  else: 'var(--color-text-muted)',
  free: 'var(--color-border)',
} as const;

const ICONS = {
  movies: FilmIcon,
  shows: TvIcon,
  anime: SparklesIcon,
  music: MusicIcon,
  books: BookOpenIcon,
  valence: LayersIcon,
  else: FileIcon,
  free: HardDriveIcon,
} as const;

/**
 * Which colour and icon a share is drawn with: a library by its kind, the rest by what they are.
 *
 * @param share - The share.
 * @returns Its key into the colours and icons.
 */
const lookOf = (share: DiskShare): keyof typeof COLOURS =>
  share.is === 'library' ? (share.libraryKind ?? 'movies') : share.is;

/**
 * How a disk is used, drawn as a bar of dots divided between each library on it, the files Valence
 * keeps, everything else and the room left, with a legend beneath it. The figure at the top is the
 * room left, beside how big the disk is. Pointing at a part of the bar or the legend lights it and
 * says more about it above the bar; the largest library is described until anything is pointed at.
 * The disks can be counted again.
 *
 * Where the libraries are spread over several disks, each can be chosen in turn, starting with the
 * one with the least room left, the datasets of a ZFS pool counting as the one disk they share.
 * Valence's own files are counted on the disk holding the folder the media service keeps its
 * previews in, with the artwork, which is kept in the same volume unless it has been moved, and are
 * left out of the others. Where the media service has not said where that folder is, or it is on no
 * disk the monitor reports, they are counted on the first disk.
 *
 * @param disks - The disks the server can see, of which those holding the libraries are drawn.
 * @param libraries - The libraries, of which those on that disk are drawn.
 * @param cache - What the media service holds on disk.
 * @param artefactRoot - Where the media service keeps its previews, or null where it has not said.
 * @param artwork - How much artwork Valence keeps.
 * @param bookPages - How much the kept pages of books hold.
 */
const DiskUsageCard = ({
  disks,
  libraries,
  cache,
  artefactRoot,
  artwork,
  bookPages,
}: DiskUsageCardProps) => {
  const [pointed, setPointed] = useState<string | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [chosenDrive, setChosenDrive] = useState<string | null>(null);
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const drives = libraryDrives(
    disks,
    libraries.map((library) => library.path),
  );
  const disk =
    drives.find((drive) => driveKeyOf(disks, drive) === chosenDrive) ?? drives[0] ?? null;

  if (disk === null) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        {say('screens.adminArea.overviewPanel.diskUsageCard.notMeasured')}
      </p>
    );
  }

  /**
   * Whether a path is on the disk being drawn, counting a ZFS pool's datasets as one disk.
   *
   * @param path - The path.
   * @returns Whether it is.
   */
  const isOnThisDisk = (path: string): boolean => {
    const holding = libraryDisks(disks, [path])[0];

    return holding !== undefined && driveKeyOf(disks, holding) === driveKeyOf(disks, disk);
  };
  const onDisk = libraries.filter((library) => isOnThisDisk(library.path));
  const isValencesDrive =
    artefactRoot === null || libraryDisks(disks, [artefactRoot]).length === 0
      ? disk === drives[0]
      : isOnThisDisk(artefactRoot);
  const shares = diskShares(
    disk,
    onDisk,
    isValencesDrive ? valenceOwnBytes(cache, artwork, bookPages) : null,
    {
      valence: say('screens.adminArea.overviewPanel.diskUsageCard.valencesFiles'),
      else: say('screens.adminArea.overviewPanel.diskUsageCard.everythingElse'),
      free: say('screens.adminArea.overviewPanel.diskUsageCard.free'),
    },
  );
  const largest = shares.find((share) => share.is === 'library') ?? shares[0];
  const shown = shares.find((share) => share.id === pointed) ?? largest;
  const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });

  /**
   * What to say about a share beside its name above the bar.
   *
   * @param share - The share.
   * @returns The sentence.
   */
  const aboutOf = (share: DiskShare): string => {
    if (share.is === 'library') {
      return say('screens.adminArea.overviewPanel.diskUsageCard.shareOfTheDisk', {
        share: percent.format(share.bytes / disk.totalBytes),
      });
    }

    if (share.is === 'valence') {
      return say('screens.adminArea.overviewPanel.diskUsageCard.valenceKeeps', {
        previews: formatBytes(cache?.previews.bytes ?? 0),
        trickplay: formatBytes(cache?.trickplay.bytes ?? 0),
        sessions: formatBytes(cache?.sessions.bytes ?? 0),
        artwork: formatBytes((artwork?.bytes ?? 0) + (bookPages?.bytes ?? 0)),
      });
    }

    return share.is === 'else'
      ? say('screens.adminArea.overviewPanel.diskUsageCard.elseIs')
      : say('screens.adminArea.overviewPanel.diskUsageCard.roomLeft', { mount: disk.mountPoint });
  };

  return (
    <div className="flex flex-col gap-5">
      {drives.length < 2 ? null : (
        <SegmentedRow
          label={say('screens.adminArea.overviewPanel.diskUsageCard.whichDrive')}
          size="sm"
          items={drives.map((drive) => ({
            id: driveKeyOf(disks, drive),
            label: say('screens.adminArea.overviewPanel.diskUsageCard.driveFull', {
              mount: drive.mountPoint,
              share: percent.format(
                drive.totalBytes === 0
                  ? 0
                  : (drive.totalBytes - drive.availableBytes) / drive.totalBytes,
              ),
            }),
          }))}
          value={driveKeyOf(disks, disk)}
          onSelect={(key) => {
            setChosenDrive(key);
            setPointed(null);
          }}
          className="self-start"
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-text">
              {formatBytes(disk.availableBytes)}
            </span>
            <span className="text-lg text-text-muted">
              {say('screens.adminArea.overviewPanel.diskUsageCard.freeOfTheDrive', {
                total: formatBytes(disk.totalBytes),
              })}
            </span>
          </p>

          {shown === undefined ? null : (
            <p className="flex h-6 min-w-0 items-center gap-x-2 overflow-hidden text-sm">
              <span className="inline-flex shrink-0" style={{ color: COLOURS[lookOf(shown)] }}>
                <Icon of={ICONS[lookOf(shown)]} size={16} tone="inherit" />
              </span>
              <span className="shrink-0 font-medium text-text">{shown.label}</span>
              <span className="shrink-0 tabular-nums text-text-muted">
                {formatBytes(shown.bytes)}
              </span>
              <span className="min-w-0 truncate text-text-muted" title={aboutOf(shown)}>
                {aboutOf(shown)}
              </span>
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          isLoading={isCounting}
          onClick={() => {
            setIsCounting(true);
            void measureStorage().finally(() => {
              setIsCounting(false);
            });
          }}
        >
          <Icon of={RefreshIcon} size={16} tone="inherit" />
          {say('screens.adminArea.overviewPanel.diskUsageCard.rescan')}
        </Button>
      </div>

      <DotBar
        label={say('screens.adminArea.overviewPanel.diskUsageCard.howTheDiskIsUsed', {
          mount: disk.mountPoint,
        })}
        litId={pointed ?? largest?.id ?? null}
        onPoint={setPointed}
        segments={shares.map((share) => ({
          id: share.id,
          share: share.bytes / disk.totalBytes,
          colour: COLOURS[lookOf(share)],
        }))}
      />

      <ScrollFade
        className="max-h-44 pr-1"
        label={say('screens.adminArea.overviewPanel.diskUsageCard.howTheDiskIsUsed', {
          mount: disk.mountPoint,
        })}
      >
        <div
          ref={containerRef}
          onPointerMove={follow}
          onPointerLeave={clear}
          onFocusCapture={follow}
          onBlurCapture={clear}
          className="relative"
        >
          <HoverHighlight rect={rect} radius="nested" />

          <ul className="relative grid grid-cols-1 gap-1 sm:grid-cols-2">
            {shares.map((share) => (
              <li key={share.id}>
                <Button
                  variant="bare"
                  size="none"
                  hasTooltip={false}
                  data-highlight={share.id}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left outline-none focus-visible:focus-ring"
                  onPointerEnter={() => {
                    setPointed(share.id);
                  }}
                  onPointerLeave={() => {
                    setPointed(null);
                  }}
                  onFocus={() => {
                    setPointed(share.id);
                  }}
                  onBlur={() => {
                    setPointed(null);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="inline-flex shrink-0"
                      style={{ color: COLOURS[lookOf(share)] }}
                    >
                      <Icon of={ICONS[lookOf(share)]} size={16} tone="inherit" />
                    </span>
                    <span className="truncate text-text">{share.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-text-muted">
                    {formatBytes(share.bytes)}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </ScrollFade>
    </div>
  );
};

DiskUsageCard.displayName = 'DiskUsageCard';

export { DiskUsageCard };
