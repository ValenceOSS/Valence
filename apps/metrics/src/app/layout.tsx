import type { Metadata } from 'next';
import { MetricsDocument } from '@ValenceMetrics/components/MetricsDocument/MetricsDocument';

const metadata: Metadata = {
  title: 'Valence statistics',
  description:
    'How Valence is run: anonymous, aggregate figures from the Valence servers that report once a day.',
  icons: { icon: '/icon.png?v=layers', apple: '/icon.png?v=layers' },
};

export { metadata };

export default MetricsDocument;
