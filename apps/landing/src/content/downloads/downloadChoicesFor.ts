import { RELEASES_URL } from './RELEASES_URL';
import type { DownloadChoice } from './DownloadChoice';
import type { LatestRelease } from './latestRelease';
import type { Platform } from './Platform';

const CHOICES = [
  { id: 'macAppleSilicon', system: 'macOS', detail: 'Apple silicon · arm64' },
  { id: 'macIntel', system: 'macOS', detail: 'Intel · x64' },
  { id: 'windows', system: 'Windows', detail: 'Installer · x64' },
  { id: 'windowsArm', system: 'Windows', detail: 'Installer · arm64' },
  { id: 'linux', system: 'Linux', detail: 'AppImage · x64' },
  { id: 'linuxArm', system: 'Linux', detail: 'AppImage · arm64' },
] as const;

const ONLY_WHERE_CARRIED: ReadonlySet<DownloadChoice['id']> = new Set(['windowsArm', 'linuxArm']);

const LEADS: Readonly<Partial<Record<Platform, DownloadChoice['id']>>> = {
  mac: 'macAppleSilicon',
  windows: 'windows',
  linux: 'linux',
};

/**
 * The desktop downloads to offer, the one for the visitor's own computer first and the rest after
 * it. A download the release does not carry leads to the release's page instead, so every choice
 * still goes somewhere, except the ARM64 builds of Windows and Linux, which releases before them do
 * not have and which are left out rather than promised. A phone or an unknown computer leads with nothing, since no desktop build is
 * the obvious one.
 *
 * @param release - The latest release, or nothing where none could be read.
 * @param platform - What the visitor is on.
 * @returns The download to lead with, if any, and the others.
 */
const downloadChoicesFor = (
  release: LatestRelease | null,
  platform: Platform,
): { lead: DownloadChoice | null; others: DownloadChoice[] } => {
  const choices: DownloadChoice[] = CHOICES.flatMap((choice) => {
    const installer = release?.installers[choice.id] ?? null;

    if (installer === null && ONLY_WHERE_CARRIED.has(choice.id)) {
      return [];
    }

    return [
      {
        ...choice,
        url: installer?.url ?? RELEASES_URL,
        fileName: installer?.name ?? null,
        sizeBytes: installer?.sizeBytes ?? null,
      },
    ];
  });
  const leading = LEADS[platform];
  const lead = choices.find((choice) => choice.id === leading) ?? null;

  return { lead, others: choices.filter((choice) => choice !== lead) };
};

export { downloadChoicesFor };
