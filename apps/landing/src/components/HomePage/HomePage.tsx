import { Hero } from '@ValenceLanding/components/HomePage/components/Hero/Hero';
import { DataOwnershipStatement } from '@ValenceLanding/components/HomePage/components/DataOwnershipStatement/DataOwnershipStatement';
import { FeatureBento } from '@ValenceLanding/components/HomePage/components/FeatureBento/FeatureBento';
import { PhoneFan } from '@ValenceLanding/components/HomePage/components/PhoneFan/PhoneFan';
import { DuoShowcase } from '@ValenceLanding/components/HomePage/components/DuoShowcase/DuoShowcase';
import { AppTour } from '@ValenceLanding/components/HomePage/components/AppTour/AppTour';
import { LatestReleases } from '@ValenceLanding/components/HomePage/components/LatestReleases/LatestReleases';
import { SectionCard } from '@ValenceUI/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';

/**
 * getvalence.app itself: the app laying itself flat under what Valence is, why it is yours, all it
 * does in its groups, the phone app fanned out, the iPhone
 * Duo opened out, a walk round the app, the newest releases, and a last
 * card asking whether you are ready, each on a rounded card of its own.
 */
const HomePage = () => (
  <>
    <Hero />

    <SectionCard>
      <DataOwnershipStatement />
    </SectionCard>

    <SectionCard>
      <FeatureBento />
    </SectionCard>

    <SectionCard>
      <PhoneFan />
    </SectionCard>

    <SectionCard>
      <DuoShowcase />
    </SectionCard>

    <SectionCard>
      <AppTour />
    </SectionCard>

    <SectionCard>
      <LatestReleases />
    </SectionCard>

    <GetStarted />
  </>
);

HomePage.displayName = 'HomePage';

export { HomePage };
