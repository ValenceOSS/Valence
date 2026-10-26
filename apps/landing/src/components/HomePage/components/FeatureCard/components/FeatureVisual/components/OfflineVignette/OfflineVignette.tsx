import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { OfflineScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/OfflineVignette/components/OfflineScene/OfflineScene';

/**
 * The sizes a download can be taken in, acted out round and round by a pointer.
 */
const OfflineVignette = () => (
  <LoopingScene scene={OfflineScene} frames={216} still={106} startsAt={10} anchor="left" />
);

OfflineVignette.displayName = 'OfflineVignette';

export { OfflineVignette };
