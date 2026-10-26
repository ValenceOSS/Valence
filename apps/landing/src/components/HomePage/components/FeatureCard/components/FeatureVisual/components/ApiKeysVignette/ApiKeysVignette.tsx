import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { ApiKeysScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ApiKeysVignette/components/ApiKeysScene/ApiKeysScene';

/**
 * The keys an account has made, acted out round and round by a pointer.
 */
const ApiKeysVignette = () => (
  <LoopingScene scene={ApiKeysScene} frames={270} anchor="left" still={144} startsAt={20} />
);

ApiKeysVignette.displayName = 'ApiKeysVignette';

export { ApiKeysVignette };
