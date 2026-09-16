import { Hero } from '@ValenceLanding/components/HomePage/components/Hero/Hero';
import { DataOwnershipStatement } from '@ValenceLanding/components/HomePage/components/DataOwnershipStatement/DataOwnershipStatement';
import { FeatureSection } from '@ValenceLanding/components/HomePage/components/FeatureSection/FeatureSection';
import { ComparisonTable } from '@ValenceLanding/components/HomePage/components/ComparisonTable/ComparisonTable';
import { CallToAction } from '@ValenceLanding/components/HomePage/components/CallToAction/CallToAction';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';

/**
 * getvalence.app itself: what Valence is, what it does, and how it compares.
 */
const HomePage = () => (
  <>
    <Hero />

    <DataOwnershipStatement />

    {FEATURE_GROUPS.map((group) => (
      <FeatureSection key={group.title} group={group} />
    ))}

    <ComparisonTable />

    <CallToAction />
  </>
);

HomePage.displayName = 'HomePage';

export { HomePage };
