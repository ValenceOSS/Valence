const WINDOW_SECONDS = 2;

const LOOKS_EVERY_MS = 1000;

const MOST_PACKETS = 2000;

type Sized = { timestamp: number; byteLength: number };

type PacketReader<Packet extends Sized> = {
  getPacket: (timestamp: number, options: { metadataOnly: boolean }) => Promise<Packet | null>;
  packets: (
    first: Packet,
    last: undefined,
    options: { metadataOnly: boolean },
  ) => AsyncIterable<Packet>;
};

/**
 * Measures the bitrate of what is playing now rather than the file's average: once a second it adds
 * up the sizes of every picture and sound packet in the two seconds before the playhead, reading
 * only their sizes, never their data, from a region the player has already read.
 *
 * @param sinks - Where the tracks' packets are read from.
 * @param clock - Where the playhead is, in seconds.
 * @returns The latest reading in kilobits a second, where one has been taken, and how to stop.
 */
const createBitrateMeter = <Packet extends Sized>(
  sinks: readonly PacketReader<Packet>[],
  clock: () => number,
): { read: () => number | null; stop: () => void } => {
  const state: { kbps: number | null; isMeasuring: boolean } = { kbps: null, isMeasuring: false };

  const measure = async () => {
    if (state.isMeasuring) {
      return;
    }

    state.isMeasuring = true;

    try {
      const until = clock();
      const from = Math.max(0, until - WINDOW_SECONDS);
      const sizes = await Promise.all(
        sinks.map(async (sink) => {
          const first = await sink.getPacket(from, { metadataOnly: true });
          let bytes = 0;
          let counted = 0;

          if (first === null) {
            return 0;
          }

          for await (const packet of sink.packets(first, undefined, { metadataOnly: true })) {
            if (packet.timestamp >= until || counted >= MOST_PACKETS) {
              break;
            }

            bytes += packet.byteLength;
            counted += 1;
          }

          return bytes;
        }),
      );
      const span = until - from;

      state.kbps =
        span <= 0
          ? null
          : Math.round((sizes.reduce((sum, size) => sum + size, 0) * 8) / span / 1000);
    } catch {
      state.kbps = null;
    } finally {
      state.isMeasuring = false;
    }
  };

  const timer = setInterval(() => {
    void measure();
  }, LOOKS_EVERY_MS);

  void measure();

  return {
    read: () => state.kbps,
    stop: () => {
      clearInterval(timer);
    },
  };
};

export { createBitrateMeter };
