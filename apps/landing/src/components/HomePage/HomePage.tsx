import { Hero } from '@ValenceLanding/components/HomePage/components/Hero/Hero';
import { DataOwnershipStatement } from '@ValenceLanding/components/HomePage/components/DataOwnershipStatement/DataOwnershipStatement';
import { FeatureSection } from '@ValenceLanding/components/HomePage/components/FeatureSection/FeatureSection';
import { ComparisonTable } from '@ValenceLanding/components/HomePage/components/ComparisonTable/ComparisonTable';
import { DownloadSection } from '@ValenceLanding/components/HomePage/components/DownloadSection/DownloadSection';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';

/**
 * getvalence.app itself: what Valence is, what it does, how it compares, and where to get it.
 */
const HomePage = () => (
  <>
    <Hero />

    <DataOwnershipStatement />

    {FEATURE_GROUPS.map((group, at) => (
      <FeatureSection key={group.title} group={group} number={at + 1} />
    ))}

    <ComparisonTable />

    <DownloadSection />
  </>
);

HomePage.displayName = 'HomePage';

export { HomePage };
