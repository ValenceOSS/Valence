import { Hero } from '@ValenceLanding/components/HomePage/components/Hero/Hero';
import { DataOwnershipStatement } from '@ValenceLanding/components/HomePage/components/DataOwnershipStatement/DataOwnershipStatement';
import { FeatureBento } from '@ValenceLanding/components/HomePage/components/FeatureBento/FeatureBento';
import { PhoneFan } from '@ValenceLanding/components/HomePage/components/PhoneFan/PhoneFan';
import { AppTour } from '@ValenceLanding/components/HomePage/components/AppTour/AppTour';
import { ComparisonTable } from '@ValenceLanding/components/HomePage/components/ComparisonTable/ComparisonTable';
import { DownloadSection } from '@ValenceLanding/components/HomePage/components/DownloadSection/DownloadSection';

/**
 * getvalence.app itself: the app laying itself flat under what Valence is, why it is yours, all it
 * does in one grid, the phone app fanned out, a walk round the app, how it compares, and where to
 * get it.
 */
const HomePage = () => (
  <>
    <Hero />

    <DataOwnershipStatement />

    <FeatureBento />

    <PhoneFan />

    <AppTour />

    <ComparisonTable />

    <DownloadSection />
  </>
);

HomePage.displayName = 'HomePage';

export { HomePage };
