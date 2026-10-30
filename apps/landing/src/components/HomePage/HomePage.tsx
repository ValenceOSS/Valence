import { HomeHero } from '@ValenceLanding/components/HomePage/components/HomeHero/HomeHero';
import { ScreensStrip } from '@ValenceLanding/components/HomePage/components/ScreensStrip/ScreensStrip';
import { Statement } from '@ValenceLanding/components/HomePage/components/Statement/Statement';
import { FigureRow } from '@ValenceLanding/components/HomePage/components/FigureRow/FigureRow';
import { LinkedServers } from '@ValenceLanding/components/HomePage/components/LinkedServers/LinkedServers';
import { LatestReleases } from '@ValenceLanding/components/HomePage/components/LatestReleases/LatestReleases';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';

const RULE = 'border-t border-[var(--surface-line)]';

/**
 * getvalence.app itself, laid out as one quiet page: what Valence is above the app in a window, the
 * screens it plays on, whose library it is, three figures of what it is, two households' servers
 * linked, the newest releases, and a last card asking whether you are ready, the larger parts
 * divided by thin rules.
 */
const HomePage = () => (
  <div className="-mt-[var(--site-nav,6.5rem)] bg-surface pt-[var(--site-nav,6.5rem)] [--frame-back:var(--color-surface)]">
    <HomeHero />
    <ScreensStrip />
    <Statement />
    <FigureRow />

    <div className={RULE}>
      <LinkedServers />
    </div>

    <div className={RULE}>
      <LatestReleases />
    </div>

    <GetStarted />
  </div>
);

HomePage.displayName = 'HomePage';

export { HomePage };
