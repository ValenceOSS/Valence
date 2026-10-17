import { Play as PlayIcon } from '@keyline-icons/react/fill';
import { BarList } from '@ValenceUI/BarList';
import { NothingHere } from '@ValenceUI/NothingHere';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { ShareChart } from '@ValenceUI/ShareChart';
import { PLAYBACK_MODES } from '@ValenceContracts/functions/describePlaybackMode';
import { PLAYBACK_DELIVERIES } from '@ValenceScreens/admin/PLAYBACK_DELIVERIES';
import { REASON_NAMES } from '@ValenceScreens/admin/REASON_NAMES';
import { say } from '@ValenceI18n/say';
import type { PlaybackModeShareProps } from './PlaybackModeShare.types';

/**
 * How plays reached their devices: sent as the file lies, repackaged, with the sound converted, or
 * converted whole — and, where given, why the server had to convert them, most common first. The
 * conversions are what cost the machine, so the reasons say which devices or files to look at.
 *
 * @param modes - How many plays were delivered each way.
 * @param reasons - Why plays were converted, and how many for each reason.
 */
const PlaybackModeShare = ({ modes, reasons }: PlaybackModeShareProps) => {
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
    <div className="flex flex-col gap-4">
      <ShareChart
        label={say('screens.adminArea.playbackModeShare.howPlaysReachedTheirDevices')}
        slices={PLAYBACK_MODES.filter((mode) => modes[mode] > 0).map((mode) => ({
          id: mode,
          label: PLAYBACK_DELIVERIES[mode].label,
          value: modes[mode],
          shown: <FormattedNumber value={modes[mode]} />,
        }))}
        total={<FormattedNumber value={plays} />}
        totalLabel={say('screens.adminArea.playbackModeShare.plays')}
        emptyMessage={say('screens.adminArea.playbackModeShare.nothingWasPlayedInThisRange')}
      />

      {reasons === undefined ? null : (
        <BarList
          label={say('screens.adminArea.playbackModeShare.whyPlaysWereConverted')}
          heading={say('screens.adminArea.playbackModeShare.whyItWasConverted')}
          valueHeading={say('screens.adminArea.playbackModeShare.plays')}
          emptyMessage={say('screens.adminArea.playbackModeShare.everyPlayWentAsTheFileLies')}
          items={reasons.slice(0, 6).map((reason) => ({
            id: reason.code,
            label: REASON_NAMES[reason.code],
            value: reason.plays,
          }))}
        />
      )}
    </div>
  );
};

PlaybackModeShare.displayName = 'PlaybackModeShare';

export { PlaybackModeShare };
