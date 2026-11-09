type CreateCpuMeterOptions = {
  read: () => Promise<number> | number;
  now?: () => number;
};

/**
 * Turns a running count of processor time into how busy something has been: each reading is the
 * percent of one core it used since the reading before, so two cores flat out read as two hundred.
 * The first reading, one taken no time after the last, and one where the count went backwards, as it
 * does after a restart, are nothing.
 *
 * @param read - The processor time used so far, in microseconds.
 * @param now - The clock, in milliseconds.
 * @returns Takes the next reading.
 */
const createCpuMeter = ({ read, now = () => performance.now() }: CreateCpuMeterOptions) => {
  let last: { micros: number; atMs: number } | null = null;

  return async (): Promise<number | null> => {
    const micros = await read();
    const atMs = now();
    const earlier = last;

    last = { micros, atMs };

    if (earlier === null) {
      return null;
    }

    const elapsedMicros = (atMs - earlier.atMs) * 1000;
    const used = micros - earlier.micros;

    return elapsedMicros <= 0 || used < 0 ? null : (used / elapsedMicros) * 100;
  };
};

export { createCpuMeter };
