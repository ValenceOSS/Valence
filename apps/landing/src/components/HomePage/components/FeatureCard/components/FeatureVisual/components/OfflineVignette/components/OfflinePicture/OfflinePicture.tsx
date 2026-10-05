import { ChoiceList } from '@ValenceUI/ChoiceList';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const SIZES = { high: '4.1 GB', saver: '1.6 GB' } as const;

const CHOICES = [
  { id: 'high', title: 'High', detail: '1080p', note: 'Converted' },
  { id: 'saver', title: 'Data saver', detail: '720p', note: 'Converted' },
].map((choice) => ({
  ...choice,
  aside: (
    <span className="text-sm font-semibold tabular-nums text-text">
      {choice.id === 'high' ? SIZES.high : SIZES.saver}
    </span>
  ),
}));

/**
 * The sizes a download can be taken in; pointed at, a smaller one is chosen and the download fills.
 */
const OfflinePicture = () => (
  <MockPanel title="Download · Harbour Lights">
    <span className="flex flex-col gap-3">
      <Swap
        delay={100}
        className="w-full"
        from={
          <ChoiceList
            label="How large to make it"
            choices={CHOICES}
            value="high"
            onChoose={nothing}
          />
        }
        to={
          <ChoiceList
            label="How large to make it"
            choices={CHOICES}
            value="saver"
            onChoose={nothing}
          />
        }
      />
      <Swap
        delay={600}
        className="w-full"
        from={<ProgressBar label="Downloading" value={38} isFull readout="24.6 MB/s" />}
        to={<ProgressBar label="Downloading" value={100} isFull readout="Offline" />}
      />
    </span>
  </MockPanel>
);

OfflinePicture.displayName = 'OfflinePicture';

export { OfflinePicture };
