import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { Badge } from '@ValenceUI/Badge';
import type { IndexerReportListProps } from './IndexerReportList.types';
import { say } from '@ValenceI18n/say';

/**
 * What each indexer said to a search: how many it found and how long it took, or why it could not
 * answer — so one that failed says so rather than simply finding nothing.
 *
 * @param reports - Each indexer's answer.
 */
const IndexerReportList = ({ reports }: IndexerReportListProps) => (
  <ul
    aria-label={say('screens.adminArea.indexerReportList.whatEachIndexerSaid')}
    className="flex flex-wrap gap-2 px-4"
  >
    {reports.map((report) => (
      <li key={report.indexerId} className="flex items-center gap-1.5">
        <Badge size="sm" tone={report.problem === null ? 'quiet' : 'danger'}>
          {report.problem === null
            ? `${report.indexerName}: ${report.found.toString()} in ${(report.tookMs / 1000).toFixed(1)}s`
            : `${report.indexerName}: ${sayAgain(report.problem)}`}
        </Badge>

        <HowToFix href={docsFor(report.problemCode)} />
      </li>
    ))}
  </ul>
);

IndexerReportList.displayName = 'IndexerReportList';

export { IndexerReportList };
