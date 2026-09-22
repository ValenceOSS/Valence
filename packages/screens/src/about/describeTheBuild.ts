import type { BuildInfo } from '@ValenceClient/platform/Platform.types';

/**
 * Says what this build is, and what the server it is talking to runs, in the one line somebody pastes
 * into a bug report.
 *
 * Either half may be missing — a browser has no build of its own, and a client not yet pointed at a
 * server has nobody to ask — so the line is whatever of the two is known.
 *
 * @param info - This client's own build, where it has one.
 * @param serverCommit - The commit the server was started from, where one answered.
 * @returns The line, or nothing where neither is known.
 */
const describeTheBuild = (info: BuildInfo | null, serverCommit: string | null): string | null => {
  const parts = [
    info === null
      ? null
      : `Valence ${info.version} (${info.commit}) · ${info.arch} · Electron ${info.electron} · Chromium ${info.chrome}`,
    serverCommit === null ? null : `Server ${serverCommit}`,
  ].filter((part) => part !== null);

  return parts.length === 0 ? null : parts.join(' · ');
};

export { describeTheBuild };
