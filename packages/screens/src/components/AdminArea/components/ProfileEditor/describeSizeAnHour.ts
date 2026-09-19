/**
 * A size an hour as a person reads it.
 *
 * @param megabytes - Megabytes an hour.
 * @returns Such as `750 MB an hour` or `5.9 GB an hour`.
 */
const describeSizeAnHour = (megabytes: number): string =>
  megabytes < 1024
    ? `${Math.round(megabytes).toString()} MB an hour`
    : `${(megabytes / 1024).toFixed(1)} GB an hour`;

export { describeSizeAnHour };
