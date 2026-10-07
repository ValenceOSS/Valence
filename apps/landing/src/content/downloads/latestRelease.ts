import { z } from 'zod';
import type { GithubReleaseJson } from 'virtual:changelog';

const releaseSchema = z.object({
  tag_name: z.string(),
  published_at: z.string().nullable(),
  html_url: z.string(),
  prerelease: z.boolean(),
  draft: z.boolean(),
  assets: z
    .array(z.object({ name: z.string(), browser_download_url: z.string(), size: z.number() }))
    .default([]),
});

type Installer = { name: string; url: string; sizeBytes: number };

type LatestRelease = {
  version: string;
  publishedAt: string | null;
  url: string;
  installers: {
    macAppleSilicon: Installer | null;
    macIntel: Installer | null;
    windows: Installer | null;
    windowsArm: Installer | null;
    linux: Installer | null;
    linuxArm: Installer | null;
  };
};

const INSTALLERS = {
  macAppleSilicon: /-arm64\.dmg$/u,
  macIntel: /-x64\.dmg$/u,
  windows: /^Valence-Setup-[\d.]+(?:-x64)?\.exe$/u,
  windowsArm: /^Valence-Setup-[\d.]+-arm64\.exe$/u,
  linux: /^Valence-[\d.]+(?:-x86_64)?\.AppImage$/u,
  linuxArm: /^Valence-[\d.]+-arm64\.AppImage$/u,
} as const;

/**
 * The newest release that has been published, and the desktop installers attached to the newest
 * release that carries any. That is usually the same one, but a release that shipped only a fix to
 * the server may carry none of its own.
 *
 * Each installer is found by the name the desktop build gives it, so a release that is missing one
 * platform offers the others rather than nothing. Windows and Linux installers were named without
 * their processor until there was an ARM64 one beside them, so a name without one is x64.
 *
 * @param raw - The releases, exactly as GitHub's API returns them.
 * @returns The latest release and where to download it, or nothing where no release could be read.
 */
const latestRelease = (raw: GithubReleaseJson[]): LatestRelease | null => {
  const releases = releaseSchema
    .array()
    .parse(raw)
    .filter((release) => !release.draft && !release.prerelease);
  const newest = releases[0];

  if (newest === undefined) {
    return null;
  }

  const carrying =
    releases.find((release) =>
      release.assets.some((asset) => INSTALLERS.windows.test(asset.name)),
    ) ?? newest;

  const find = (pattern: RegExp): Installer | null => {
    const asset = carrying.assets.find((candidate) => pattern.test(candidate.name));

    return asset === undefined
      ? null
      : { name: asset.name, url: asset.browser_download_url, sizeBytes: asset.size };
  };

  return {
    version: newest.tag_name,
    publishedAt: newest.published_at === null ? null : newest.published_at.slice(0, 10),
    url: newest.html_url,
    installers: {
      macAppleSilicon: find(INSTALLERS.macAppleSilicon),
      macIntel: find(INSTALLERS.macIntel),
      windows: find(INSTALLERS.windows),
      windowsArm: find(INSTALLERS.windowsArm),
      linux: find(INSTALLERS.linux),
      linuxArm: find(INSTALLERS.linuxArm),
    },
  };
};

export type { Installer, LatestRelease };

export { latestRelease };
