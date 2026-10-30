import { HomeHero } from '@ValenceLanding/components/HomePage/components/HomeHero/HomeHero';
import { ScreensStrip } from '@ValenceLanding/components/HomePage/components/ScreensStrip/ScreensStrip';
import { FigureRow } from '@ValenceLanding/components/HomePage/components/FigureRow/FigureRow';
import { FeatureBento } from '@ValenceLanding/components/HomePage/components/FeatureBento/FeatureBento';
import { PhoneFan } from '@ValenceLanding/components/HomePage/components/PhoneFan/PhoneFan';
import { DuoShowcase } from '@ValenceLanding/components/HomePage/components/DuoShowcase/DuoShowcase';
import { AppTour } from '@ValenceLanding/components/HomePage/components/AppTour/AppTour';
import { LatestReleases } from '@ValenceLanding/components/HomePage/components/LatestReleases/LatestReleases';
import { SectionCard } from '@ValenceUI/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';

/**
 * getvalence.app itself: what Valence is on a card of light written in characters, with the app in
 * a window hanging over its foot, the screens it plays on, three figures of what it is, all it does
 * in its groups, the phone app fanned out, the iPhone Duo opened out, a walk round the app, the
 * newest releases, and a last card asking whether you are ready, each on a rounded card of its own.
 */
const HomePage = () => (
  <>
    <HomeHero />

    <ScreensStrip />

    <SectionCard>
      <FigureRow />
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
