import { MetricsShell } from '@ValenceMetrics/components/MetricsShell/MetricsShell';
import { readStarCountNow } from '@ValenceMetrics/github/readStarCountNow';
import type { MetricsDocumentProps } from './MetricsDocument.types';
import '@ValenceMetrics/styles/metrics.css';

/**
 * The document every page of the statistics site is drawn into, with the project's star count
 * read for the bar along its top.
 *
 * @param children - The page.
 */
const MetricsDocument = async ({ children }: MetricsDocumentProps) => {
  const starCount = await readStarCountNow();

  return (
    <html lang="en">
      <body>
        <MetricsShell starCount={starCount}>{children}</MetricsShell>
      </body>
    </html>
  );
};

MetricsDocument.displayName = 'MetricsDocument';

export { MetricsDocument };
