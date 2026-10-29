import { MetricsShell } from '@ValenceMetrics/components/MetricsShell/MetricsShell';
import type { MetricsDocumentProps } from './MetricsDocument.types';
import '@ValenceMetrics/styles/metrics.css';

/**
 * The document every page of the statistics site is drawn into.
 *
 * @param children - The page.
 */
const MetricsDocument = ({ children }: MetricsDocumentProps) => (
  <html lang="en">
    <body>
      <MetricsShell>{children}</MetricsShell>
    </body>
  </html>
);

MetricsDocument.displayName = 'MetricsDocument';

export { MetricsDocument };
