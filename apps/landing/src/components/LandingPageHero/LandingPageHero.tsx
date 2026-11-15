import { PageHero } from '@ValenceUI/PageHero';
import { HeroGround } from '@ValenceLanding/components/HeroGround/HeroGround';
import type { LandingPageHeroProps } from './LandingPageHero.types';

/**
 * The card a page of getvalence.app opens on, on the same ground as the home page's hero, with the
 * page's name set solid and heavy.
 *
 * @param props - Everything `PageHero` takes, bar its ground and how its name is set.
 */
const LandingPageHero = (props: LandingPageHeroProps) => (
  <PageHero {...props} ground={<HeroGround />} isFlat />
);

LandingPageHero.displayName = 'LandingPageHero';

export { LandingPageHero };
