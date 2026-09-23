import { useQuery } from '@tanstack/react-query';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';

/**
 * What this build of Valence is, and what the server answering it is running, sat in the corner of
 * the account dialog's own foot the way a desktop application signs its about screen — Discord's own
 * settings put a version exactly there.
 *
 * Nothing here is a control — it names a build, down to the commit it was cut from and the
 * architecture it was compiled for, for whoever is about to paste it into a bug report. The server's
 * own commit is worth having alongside it, because a client and the server it is talking to are not
 * always cut from the same one. A browser has no build of its own to report, so it names only the
 * server.
 */
const BuildInfoFooter = () => {
  const server = useQuery(aboutQueries.server());
  const line = describeTheBuild(theBuildInfo(), server.data?.commit ?? null);

  if (line === null) {
    return null;
  }

  return <p className="shrink-0 whitespace-nowrap text-xs text-text-muted">{line}</p>;
};

BuildInfoFooter.displayName = 'BuildInfoFooter';

export { BuildInfoFooter };
