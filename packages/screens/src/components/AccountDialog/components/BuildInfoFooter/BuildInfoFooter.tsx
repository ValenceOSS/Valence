import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';

/**
 * What this build of Valence is, sat in the corner of the account dialog's own foot the way a
 * desktop application signs its about screen — Discord's own settings put a version exactly there.
 *
 * Nothing here is a control — it names a build, down to the commit it was cut from and the
 * architecture it was compiled for, for whoever is about to paste it into a bug report. A browser
 * has no build of its own to report, so it draws nothing.
 */
const BuildInfoFooter = () => {
  const info = theBuildInfo();

  if (info === null) {
    return null;
  }

  return (
    <p className="shrink-0 whitespace-nowrap text-xs text-text-muted">
      Valence {info.version} ({info.commit}) · {info.arch} · Electron {info.electron} · Chromium{' '}
      {info.chrome}
    </p>
  );
};

BuildInfoFooter.displayName = 'BuildInfoFooter';

export { BuildInfoFooter };
