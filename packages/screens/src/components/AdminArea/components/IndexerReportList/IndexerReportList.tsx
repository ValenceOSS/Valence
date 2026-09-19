import { Badge } from '@ValenceUI/Badge';
import type { IndexerReportListProps } from './IndexerReportList.types';

/**
 * What each indexer said to a search: how many it found and how long it took, or why it could not
 * answer — so one that failed says so rather than simply finding nothing.
 *
 * @param reports - Each indexer's answer.
 */
const IndexerReportList = ({ reports }: IndexerReportListProps) => (
  <ul aria-label="What each indexer said" className="flex flex-wrap gap-2 px-4">
    {reports.map((report) => (
      <li key={report.indexerId}>
        <Badge size="sm" tone={report.problem === null ? 'quiet' : 'danger'}>
          {report.problem === null
            ? `${report.indexerName}: ${report.found.toString()} in ${(report.tookMs / 1000).toFixed(1)}s`
            : `${report.indexerName}: ${report.problem}`}
        </Badge>
      </li>
    ))}
  </ul>
);

IndexerReportList.displayName = 'IndexerReportList';

export { IndexerReportList };
