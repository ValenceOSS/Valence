import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { DevicesScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/DevicesVignette/components/DevicesScene/DevicesScene';

/**
 * Three devices watching at once, each told what it gets, acted out round and round: the phone
 * that was being converted for finds it can take the file as it is.
 */
const DevicesVignette = () => (
  <LoopingScene
    scene={DevicesScene}
    frames={240}
    width={460}
    height={236}
    still={180}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

DevicesVignette.displayName = 'DevicesVignette';

export { DevicesVignette };
