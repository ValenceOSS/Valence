import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { AuthScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/AuthVignette/components/AuthScene/AuthScene';

/**
 * The sign in asking for its code from an authenticator, acted out round and round by a pointer.
 */
const AuthVignette = () => (
  <LoopingScene scene={AuthScene} frames={232} still={118} startsAt={140} anchor="centre" />
);

AuthVignette.displayName = 'AuthVignette';

export { AuthVignette };
