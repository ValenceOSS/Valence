import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { ShareLinkScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShareLinkVignette/components/ShareLinkScene/ShareLinkScene';

/**
 * A link made for one series, with how long it lasts, acted out round and round by a pointer.
 */
const ShareLinkVignette = () => (
  <LoopingScene scene={ShareLinkScene} frames={252} still={134} startsAt={120} anchor="centre" />
);

ShareLinkVignette.displayName = 'ShareLinkVignette';

export { ShareLinkVignette };
