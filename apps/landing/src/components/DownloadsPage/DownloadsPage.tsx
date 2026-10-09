import { DownloadSection } from '@ValenceLanding/components/DownloadsPage/components/DownloadSection/DownloadSection';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';

/**
 * Everything there is to download in one place: the desktop app for every computer, the commands
 * that start a server, and the phone apps, beneath the page's opening card and above the way to get
 * started.
 */
const DownloadsPage = () => (
  <>
    <PageHero
      eyebrow="Download"
      lead="Valence for"
      accent="every"
      trail="screen"
      description="A server you run, and an app for every screen that watches from it."
    />

    <SectionCard>
      <DownloadSection />
    </SectionCard>

    <GetStarted />
  </>
);

DownloadsPage.displayName = 'DownloadsPage';

export { DownloadsPage };
