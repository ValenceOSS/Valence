import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { SetupScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SetupVignette/components/SetupScene/SetupScene';

/**
 * The first run wizard part way through, acted out round and round by a pointer.
 */
const SetupVignette = () => (
  <LoopingScene scene={SetupScene} frames={222} still={110} startsAt={180} anchor="left" />
);

SetupVignette.displayName = 'SetupVignette';

export { SetupVignette };
