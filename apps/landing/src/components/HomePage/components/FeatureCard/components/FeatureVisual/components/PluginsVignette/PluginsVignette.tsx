import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { PluginsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PluginsVignette/components/PluginsScene/PluginsScene';

/**
 * A plugin asking for what it may touch, acted out round and round by a pointer.
 */
const PluginsVignette = () => (
  <LoopingScene scene={PluginsScene} frames={240} still={122} startsAt={200} anchor="left" />
);

PluginsVignette.displayName = 'PluginsVignette';

export { PluginsVignette };
