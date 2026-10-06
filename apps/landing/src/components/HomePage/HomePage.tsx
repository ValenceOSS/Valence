import { Hero } from '@ValenceLanding/components/HomePage/components/Hero/Hero';
import { DataOwnershipStatement } from '@ValenceLanding/components/HomePage/components/DataOwnershipStatement/DataOwnershipStatement';
import { FeatureBento } from '@ValenceLanding/components/HomePage/components/FeatureBento/FeatureBento';
import { PhoneFan } from '@ValenceLanding/components/HomePage/components/PhoneFan/PhoneFan';
import { AppTour } from '@ValenceLanding/components/HomePage/components/AppTour/AppTour';
import { SectionCard } from '@ValenceLanding/components/SectionCard/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';

/**
 * getvalence.app itself: the app laying itself flat under what Valence is, why it is yours, all it
 * does in its groups, the phone app fanned out, a walk round the app, and a last card asking
 * whether you are ready, each on a rounded card of its own.
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
      <AppTour />
    </SectionCard>

    <GetStarted />
  </>
);

HomePage.displayName = 'HomePage';

export { HomePage };
