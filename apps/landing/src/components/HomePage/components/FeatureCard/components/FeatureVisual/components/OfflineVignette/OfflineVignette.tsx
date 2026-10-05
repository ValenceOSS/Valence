import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { OfflineScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/OfflineVignette/components/OfflineScene/OfflineScene';

/**
 * The sizes a download can be taken in, acted out round and round by a pointer.
 */
const OfflineVignette = () => (
  <LoopingScene
    scene={OfflineScene}
    frames={216}
    width={323}
    height={300}
    still={106}
    startsAt={10}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

OfflineVignette.displayName = 'OfflineVignette';

export { OfflineVignette };
