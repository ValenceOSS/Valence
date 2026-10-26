import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { WebhooksScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/WebhooksVignette/components/WebhooksScene/WebhooksScene';

/**
 * The admin page of webhooks with their last delivery, acted out round and round by a pointer.
 */
const WebhooksVignette = () => (
  <LoopingScene scene={WebhooksScene} frames={258} anchor="left" still={130} startsAt={30} />
);

WebhooksVignette.displayName = 'WebhooksVignette';

export { WebhooksVignette };
