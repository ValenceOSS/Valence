import { InfoNote } from '@ValenceUI/InfoNote';
import { InfoRow } from '@ValenceUI/InfoRow';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import type { NetworkInfoProps } from './NetworkInfo.types';
import { say } from '@ValenceI18n/say';

/**
 * What the network is moving: coming in, going out, how much of what goes out is Valence streaming to
 * viewers and how much is everything else, with "—" for any figure that could not be read.
 *
 * @param network - The machine's speeds in and out, where its counters could be read.
 * @param streamedBytesPerSecond - How fast Valence is sending viewers what they watch, hear or keep.
 */
const NetworkInfo = ({ network, streamedBytesPerSecond }: NetworkInfoProps) => (
  <>
    <InfoRow label={say('screens.adminArea.networkFigure.comingIn')}>
      {network === null ? (
        '—'
      ) : (
        <FormattedBytes bytes={network.receivedBytesPerSecond} suffix="/s" />
      )}
    </InfoRow>

    <InfoRow label={say('screens.adminArea.networkFigure.goingOut')}>
      {network === null ? '—' : <FormattedBytes bytes={network.sentBytesPerSecond} suffix="/s" />}
    </InfoRow>

    <InfoRow label={say('screens.adminArea.networkFigure.streamingToViewers')}>
      {streamedBytesPerSecond === null ? (
        '—'
      ) : (
        <FormattedBytes bytes={streamedBytesPerSecond} suffix="/s" />
      )}
    </InfoRow>

    <InfoRow label={say('screens.adminArea.networkFigure.everythingElseGoingOut')}>
      {network === null || streamedBytesPerSecond === null ? (
        '—'
      ) : (
        <FormattedBytes
          bytes={Math.max(0, network.sentBytesPerSecond - streamedBytesPerSecond)}
          suffix="/s"
        />
      )}
    </InfoRow>

    {network === null ? (
      <InfoNote>{say('screens.adminArea.networkFigure.countersCouldNotBeRead')}</InfoNote>
    ) : null}
  </>
);

NetworkInfo.displayName = 'NetworkInfo';

export { NetworkInfo };
