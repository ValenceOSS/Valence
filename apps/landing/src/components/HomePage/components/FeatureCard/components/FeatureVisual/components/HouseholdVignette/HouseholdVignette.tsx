import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { HouseholdScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HouseholdVignette/components/HouseholdScene/HouseholdScene';

/**
 * The household picker as the app opens on it, acted out round and round by a pointer.
 */
const HouseholdVignette = () => (
  <LoopingScene
    scene={HouseholdScene}
    frames={250}
    width={323}
    height={185}
    still={132}
    startsAt={60}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

HouseholdVignette.displayName = 'HouseholdVignette';

export { HouseholdVignette };
