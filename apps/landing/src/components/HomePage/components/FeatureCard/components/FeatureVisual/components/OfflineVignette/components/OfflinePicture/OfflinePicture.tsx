import { DialogContent } from '@ValenceUI/DialogContent';
import type { DownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { DownloadOptions } from '@ValenceScreens/components/DownloadDialog/components/DownloadOptions/DownloadOptions';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { OfflinePictureProps } from './OfflinePicture.types';

const OPTIONS: DownloadOffer['options'] = [
  {
    quality: '1080p',
    label: '1080p',
    meaning: 'Sharp on a laptop or a TV.',
    bytes: 4_100_000_000,
    comparison: null,
    wouldTranscode: true,
    savesSpace: true,
  },
  {
    quality: '720p',
    label: '720p',
    meaning: 'Plenty for a phone.',
    bytes: 1_600_000_000,
    comparison: null,
    wouldTranscode: true,
    savesSpace: true,
  },
];

const FREE_BYTES = 64_000_000_000;

/**
 * The app's own download dialog offering the sizes a film can be taken away in; pointed at, a smaller one is chosen.
 *
 * @param chosen - The size chosen so far.
 */
const OfflinePicture = ({ chosen = '1080p' }: OfflinePictureProps) => (
  <div className="absolute left-6 top-6 w-[36rem] text-left">
    <div className="valence-card-shell flex flex-col rounded-2xl p-1 shadow-[var(--shadow-lifted)]">
      <div className="valence-card-face flex flex-col overflow-hidden rounded-xl">
        <DialogContent>
          <DownloadOptions
            options={OPTIONS}
            chosen={chosen}
            onChoose={nothing}
            isOfASeries={false}
            freeBytes={FREE_BYTES}
          />
        </DialogContent>
      </div>
    </div>
  </div>
);

OfflinePicture.displayName = 'OfflinePicture';

export { OfflinePicture };
