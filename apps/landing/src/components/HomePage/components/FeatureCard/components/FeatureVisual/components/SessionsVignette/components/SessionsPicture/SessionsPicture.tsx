import { PanelCard } from '@ValenceUI/PanelCard';
import { SessionCards } from '@ValenceScreens/components/AdminArea/components/SessionCards/SessionCards';
import { aShowcaseSession } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/aShowcaseSession';
import { ShowcaseScope } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseScope/ShowcaseScope';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import { say } from '@ValenceI18n/say';
import type { SessionsPictureProps } from './SessionsPicture.types';

const WATCHING = [
  aShowcaseSession({
    id: 'maya-tv',
    who: 'Maya',
    title: 'Harbour Lights',
    episode: { season: 2, number: 4, title: 'Low Tide' },
    device: 'Living room TV',
    kind: 'tv',
    isConverting: false,
    at: 0.71,
  }),
  aShowcaseSession({
    id: 'jonah-phone',
    who: 'Jonah',
    title: 'The Lantern Keepers',
    device: 'Pixel 9',
    kind: 'phone',
    isConverting: true,
    at: 0.23,
  }),
];

const ARRIVING = aShowcaseSession({
  id: 'theo-tablet',
  who: 'Theo',
  title: 'Northbound',
  device: 'iPad mini',
  kind: 'phone',
  isConverting: false,
  at: 0.04,
});

/**
 * The admin page of who is watching now, drawn by the app's own session cards; acted out, somebody
 * else starts and their session arrives.
 *
 * @param isActed - Whether the third viewer has started watching.
 */
const SessionsPicture = ({ isActed = false }: SessionsPictureProps) => (
  <ShowcaseScope>
    <PanelCard title={say('common.sessions')} className="w-full text-left">
      <SessionCards
        sessions={isActed ? [ARRIVING, ...WATCHING] : WATCHING}
        busyClientId={null}
        onStop={nothing}
        onPause={nothing}
        onResume={nothing}
        onMessage={nothing}
      />
    </PanelCard>
  </ShowcaseScope>
);

SessionsPicture.displayName = 'SessionsPicture';

export { SessionsPicture };
