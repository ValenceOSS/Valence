import { say } from '@ValenceI18n/say';

/**
 * A size an hour as a person reads it.
 *
 * @param megabytes - Megabytes an hour.
 * @returns Such as `750 MB an hour` or `5.9 GB an hour`.
 */
const describeSizeAnHour = (megabytes: number): string =>
  megabytes < 1024
    ? say('screens.profileEditor.describeSizeAnHour.megabytesMBAnHour', {
        megabytes: Math.round(megabytes).toString(),
      })
    : say('screens.profileEditor.describeSizeAnHour.valueGBAnHour', {
        value: (megabytes / 1024).toFixed(1),
      });

export { describeSizeAnHour };
