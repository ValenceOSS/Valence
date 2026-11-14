import { z } from 'zod';

const LanguagesSchema = z.array(z.string()).min(1);

/**
 * The languages this device is set to, most wanted first: every one a browser lists, or the one
 * an app's runtime reports where there is no list.
 *
 * @returns Language tags, such as `de-AT`.
 */
const thisDevicesLanguages = (): readonly string[] => {
  const listed = LanguagesSchema.safeParse(
    typeof navigator === 'undefined' ? undefined : navigator.languages,
  );

  return listed.success ? listed.data : [Intl.DateTimeFormat().resolvedOptions().locale];
};

export { thisDevicesLanguages };
