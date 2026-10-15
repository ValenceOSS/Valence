import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import type { AWayInLightsProps } from './AWayInLights.types';

/**
 * The lights behind the way in and who is watching: the house colours while nobody is picked, and
 * the colours of whoever is, read from their picture where they have one and their own colour where
 * they have not, so every step of choosing somebody is lit the same way.
 *
 * @param profile - Whoever is picked, or nobody yet.
 */
const AWayInLights = ({ profile }: AWayInLightsProps) => {
  const lights = usePictureLights(profile === null ? null : (thePictureFor(profile)?.uri ?? null));

  return lights.length > 0 ? (
    <AMoodBackground palette={lights} />
  ) : (
    <AMoodBackground lights={profile === null ? [] : [profile.colour]} />
  );
};

AWayInLights.displayName = 'AWayInLights';

export { AWayInLights };
