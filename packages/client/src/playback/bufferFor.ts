const BYTES_AHEAD = 80 * 1024 * 1024;

const BYTES_BEHIND = 20 * 1024 * 1024;

const FEWEST_SECONDS_AHEAD = 10;

const MOST_SECONDS_AHEAD = 60;

const FEWEST_SECONDS_BEHIND = 5;

const MOST_SECONDS_BEHIND = 30;

const UNKNOWN_BITRATE_SECONDS_AHEAD = 30;

type Buffer = {
  aheadSeconds: number;
  behindSeconds: number;
};

/**
 * How far ahead of the viewer to fetch and how much already watched to keep, for a stream of this
 * bitrate. Held to a budget in bytes, because a browser refuses a buffer by its size: Chrome ended a
 * 14.5 Mbps remux with `QUOTA_EXCEEDED` (VAL-125). Never further ahead than the transcoder runs,
 * which is a minute.
 *
 * @param bitrateKbps - What the stream costs, or null where nobody said.
 * @returns The seconds to hold ahead and behind.
 */
const bufferFor = (bitrateKbps: number | null): Buffer => {
  if (bitrateKbps === null || !Number.isFinite(bitrateKbps) || bitrateKbps <= 0) {
    return { aheadSeconds: UNKNOWN_BITRATE_SECONDS_AHEAD, behindSeconds: MOST_SECONDS_BEHIND };
  }

  const bytesPerSecond = (bitrateKbps * 1000) / 8;
  const within = (bytes: number, fewest: number, most: number) =>
    Math.round(Math.min(Math.max(bytes / bytesPerSecond, fewest), most));

  return {
    aheadSeconds: within(BYTES_AHEAD, FEWEST_SECONDS_AHEAD, MOST_SECONDS_AHEAD),
    behindSeconds: within(BYTES_BEHIND, FEWEST_SECONDS_BEHIND, MOST_SECONDS_BEHIND),
  };
};

export type { Buffer };

export { bufferFor };
