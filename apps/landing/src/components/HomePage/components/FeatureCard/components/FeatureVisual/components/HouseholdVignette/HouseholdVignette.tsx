import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { HouseholdScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HouseholdVignette/components/HouseholdScene/HouseholdScene';

/**
 * The household picker as the app opens on it, acted out round and round by a pointer.
 */
const HouseholdVignette = () => (
  <LoopingScene scene={HouseholdScene} frames={250} still={132} startsAt={60} anchor="centre" />
);

HouseholdVignette.displayName = 'HouseholdVignette';

export { HouseholdVignette };
