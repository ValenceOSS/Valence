import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { PluginsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PluginsVignette/components/PluginsScene/PluginsScene';

/**
 * A plugin asking for what it may touch, acted out round and round by a pointer.
 */
const PluginsVignette = () => (
  <LoopingScene
    scene={PluginsScene}
    frames={240}
    width={323}
    height={345}
    still={122}
    startsAt={200}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

PluginsVignette.displayName = 'PluginsVignette';

export { PluginsVignette };
