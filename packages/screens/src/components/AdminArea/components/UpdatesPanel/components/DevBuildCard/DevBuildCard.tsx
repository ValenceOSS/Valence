import { PanelCard } from '@ValenceUI/PanelCard';
import { Link } from '@ValenceUI/Link';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { DevBuildCardProps } from './DevBuildCard.types';

/**
 * What the newest dev build has that this one does not: each commit on main by its title, newest
 * first, linking to it on GitHub, and how many more there are past those listed.
 *
 * @param dev - How this dev build compares with the newest one.
 * @param now - The time, for saying how long ago each change was made.
 */
const DevBuildCard = ({ dev, now }: DevBuildCardProps) => (
  <PanelCard
    title={sayCount(
      'screens.adminArea.updatesPanel.devBuildCard.count.changesSinceThisBuild',
      dev.behindBy,
    )}
  >
    {dev.isOffMain ? (
      <p className="pb-3 text-sm text-text-muted">
        {say('screens.adminArea.updatesPanel.devBuildCard.thisBuildHasCommitsNotOnMain')}
      </p>
    ) : null}

    <ul className="flex flex-col gap-2.5">
      {dev.commits.map((change) => (
        <li key={change.sha} className="flex min-w-0 flex-col gap-0.5">
          <Link href={change.url} className="text-sm [overflow-wrap:anywhere]">
            {change.subject}
          </Link>

          <span className="text-xs tabular-nums text-text-muted">
            {change.committedAt === null
              ? change.sha
              : say('screens.adminArea.updatesPanel.devBuildCard.shaWhen', {
                  sha: change.sha,
                  when: describeSince(change.committedAt, now),
                })}
          </span>
        </li>
      ))}
    </ul>

    {dev.behindBy > dev.commits.length ? (
      <p className="pt-3 text-xs text-text-muted">
        {sayCount(
          'screens.adminArea.updatesPanel.devBuildCard.count.andMore',
          dev.behindBy - dev.commits.length,
        )}
      </p>
    ) : null}
  </PanelCard>
);

DevBuildCard.displayName = 'DevBuildCard';

export { DevBuildCard };
