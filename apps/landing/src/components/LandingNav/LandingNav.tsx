import { useRouterState } from '@tanstack/react-router';
import { readStarCount } from '@ValenceCore/project/readStarCount';
import { SiteNav } from '@ValenceUI/SiteNav';
import { LandingLink } from '@ValenceLanding/components/LandingLink/LandingLink';
import { ReleaseBar } from '@ValenceLanding/components/ReleaseBar/ReleaseBar';
import { DockedBand } from '@ValenceLanding/components/LandingNav/components/DockedBand/DockedBand';
import { useIsHeroBandGone } from '@ValenceLanding/components/LandingNav/useIsHeroBandGone';
import repository from 'virtual:github-stars';

const STAR_COUNT = readStarCount(repository);

/**
 * The bar every page of getvalence.app carries: Valence's shared bar, with the line about the
 * newest release across its top and, on the home page once the hero's band has scrolled away, the
 * band running across it instead.
 */
const LandingNav = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isBandGone = useIsHeroBandGone();

  return (
    <SiteNav
      here="landing"
      pathname={pathname}
      InSiteLink={LandingLink}
      starCount={STAR_COUNT}
      banner={<ReleaseBar />}
      dock={<DockedBand isShown={isBandGone && pathname === '/'} />}
    />
  );
};

LandingNav.displayName = 'LandingNav';

export { LandingNav };
