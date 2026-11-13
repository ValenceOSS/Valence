import { PanelCard } from '@ValenceUI/PanelCard';
import { TrendChart } from '@ValenceUI/TrendChart';
import { InfoRow } from '@ValenceUI/InfoRow';
import { roundUpToNice } from './roundUpToNice';
import type { StreamTrendsProps } from './StreamTrends.types';
import { say } from '@ValenceI18n/say';

const BITRATE_COLOUR = 'var(--color-highlight)';

/**
 * Writes a number of kilobits a second as megabits, to one place.
 *
 * @param kbps - The kilobits a second, where there is a reading.
 * @returns The megabits, or nothing where there is no reading.
 */
const describeMbps = (kbps: number | null): string | null =>
  kbps === null
    ? null
    : say('client.playback.describeRungCost.valueMbps', { value: (kbps / 1000).toFixed(1) });

/**
 * The last minute of the stream drawn over time: how fast the connection is set against what the
 * stream needs, and how far ahead the buffer has run, so a stall can be told apart from a slow
 * network at a glance.
 *
 * @param history - The readings, oldest first, one each time the panel samples.
 * @param fileBitrateKbps - The file's own bitrate, drawn where a reading has none because the file
 *   is played directly.
 */
const StreamTrends = ({ history, fileBitrateKbps = null }: StreamTrendsProps) => {
  const connection = history.map((reading) => reading.connectionKbps);
  const bitrate = history.map((reading) => reading.bitrateKbps ?? fileBitrateKbps);
  const buffered = history.map((reading) => reading.bufferedAheadSeconds);
  const networkCeiling = roundUpToNice(
    Math.max(0, ...[...connection, ...bitrate].map((kbps) => kbps ?? 0)),
  );
  const bufferCeiling = roundUpToNice(Math.max(0, ...buffered));

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <PanelCard title={say('common.network')} isCompact isFlush>
        <div className="p-2.5">
          <TrendChart
            values={connection}
            lines={[{ values: bitrate, colour: BITRATE_COLOUR }]}
            ceiling={networkCeiling}
            gridLines={[0, networkCeiling / 2, networkCeiling]}
            tickOf={(value) => (value / 1000).toFixed(0)}
            label={say('screens.videoPlayer.streamStats.networkOverTime')}
            tipOf={(index) => {
              const reading = history[index];

              return reading === undefined ? null : (
                <>
                  <InfoRow label={say('common.connection')} keyClassName="text-accent">
                    {describeMbps(reading.connectionKbps)}
                  </InfoRow>
                  <InfoRow label={say('common.bitrate')} keyClassName="text-highlight">
                    {describeMbps(reading.bitrateKbps ?? fileBitrateKbps)}
                  </InfoRow>
                </>
              );
            }}
          />
        </div>
      </PanelCard>

      <PanelCard title={say('screens.videoPlayer.streamStats.buffer')} isCompact isFlush>
        <div className="p-2.5">
          <TrendChart
            values={buffered}
            ceiling={bufferCeiling}
            gridLines={[0, bufferCeiling / 2, bufferCeiling]}
            tickOf={(value) =>
              say('screens.videoPlayer.streamStats.valueSeconds', { value: value.toFixed(0) })
            }
            label={say('screens.videoPlayer.streamStats.bufferOverTime')}
            tipOf={(index) => {
              const seconds = buffered[index];

              return seconds === undefined ? null : (
                <InfoRow
                  label={say('screens.videoPlayer.streamStats.buffer')}
                  keyClassName="text-accent"
                >
                  {say('screens.videoPlayer.streamStats.valueSeconds', {
                    value: seconds.toFixed(1),
                  })}
                </InfoRow>
              );
            }}
          />
        </div>
      </PanelCard>
    </div>
  );
};

StreamTrends.displayName = 'StreamTrends';

export { StreamTrends };
