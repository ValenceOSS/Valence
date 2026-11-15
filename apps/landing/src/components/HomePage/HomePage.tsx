import { HomeHero } from '@ValenceLanding/components/HomePage/components/HomeHero/HomeHero';
import { ScreensStrip } from '@ValenceLanding/components/HomePage/components/ScreensStrip/ScreensStrip';
import { FeatureBento } from '@ValenceLanding/components/HomePage/components/FeatureBento/FeatureBento';
import { PhoneFan } from '@ValenceLanding/components/HomePage/components/PhoneFan/PhoneFan';
import { LivingRoom } from '@ValenceLanding/components/HomePage/components/LivingRoom/LivingRoom';
import { SectionCard } from '@ValenceUI/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';

/**
 * getvalence.app itself: what Valence is on a card of light written in characters, with the app in
 * a window hanging over its foot, the screens it plays on, all it does
 * in its groups, the phone app fanned out, the television app in a living room, and a last card
 * asking whether you are ready, each on a rounded card of its own.
 */
const HomePage = () => (
  <>
    <HomeHero />

    <ScreensStrip />

    <SectionCard>
      <FeatureBento />
    </SectionCard>

    <SectionCard>
      <PhoneFan />
    </SectionCard>

    <SectionCard>
      <LivingRoom />
    </SectionCard>

    <GetStarted />
  </>
);

HomePage.displayName = 'HomePage';

export { HomePage };
