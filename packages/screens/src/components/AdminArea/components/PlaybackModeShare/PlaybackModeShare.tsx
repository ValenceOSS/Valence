import { Play as PlayIcon } from '@keyline-icons/react/fill';
import { NothingHere } from '@ValenceUI/NothingHere';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { ShareChart } from '@ValenceUI/ShareChart';
import { PLAYBACK_MODES } from '@ValenceContracts/functions/describePlaybackMode';
import { PLAYBACK_DELIVERIES } from '@ValenceScreens/admin/PLAYBACK_DELIVERIES';
import { say } from '@ValenceI18n/say';
import type { PlaybackModeShareProps } from './PlaybackModeShare.types';

/**
 * How plays reached their devices: sent as the file lies, repackaged, with the sound converted, or
 * converted whole.
 *
 * @param modes - How many plays were delivered each way.
 */
const PlaybackModeShare = ({ modes }: PlaybackModeShareProps) => {
  const plays = PLAYBACK_MODES.reduce((sum, mode) => sum + modes[mode], 0);

  if (plays === 0) {
    return (
      <NothingHere
        isCompact
        of={PlayIcon}
        title={say('screens.adminArea.playbackModeShare.nothingWasPlayedInThisRange')}
      />
    );
  }

  return (
    <ShareChart
      label={say('screens.adminArea.playbackModeShare.howPlaysReachedTheirDevices')}
      slices={PLAYBACK_MODES.filter((mode) => modes[mode] > 0).map((mode) => ({
        id: mode,
        label: PLAYBACK_DELIVERIES[mode].label,
        value: modes[mode],
        shown: <FormattedNumber value={modes[mode]} />,
      }))}
      total={<FormattedNumber value={plays} />}
      totalLabel={say('screens.importWizard.importReportView.plays')}
      emptyMessage={say('screens.adminArea.playbackModeShare.nothingWasPlayedInThisRange')}
    />
  );
};

PlaybackModeShare.displayName = 'PlaybackModeShare';

export { PlaybackModeShare };
