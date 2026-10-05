import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { ReaderScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ReaderVignette/components/ReaderScene/ReaderScene';

/**
 * A book open in the reader on a wide screen, two columns side by side, a pointer turning the
 * spread round and round as the reader's own turn does.
 */
const ReaderVignette = () => (
  <div className="valence-card-shell w-full max-w-[var(--vignette-width)] shadow-[var(--shadow-lifted)]">
    <LoopingScene
      scene={ReaderScene}
      frames={240}
      width={423}
      height={264}
      still={100}
      startsAt={50}
    />
  </div>
);

ReaderVignette.displayName = 'ReaderVignette';

export { ReaderVignette };
