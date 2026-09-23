import { render } from '@testing-library/react-native';
import { DownloadReadout } from '@ValenceTv/components/DownloadReadout/DownloadReadout';
import { tokens } from '@ValenceTv/theme/tokens';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

const PROGRESS: RequestProgress = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  state: 'downloading',
  progress: 0.25,
  sizeBytes: 2_147_483_648,
  doneBytes: 536_870_912,
  downloadBytesPerSecond: 5_242_880,
  secondsLeft: 600,
};

describe('DownloadReadout', () => {
  it('says how far through, how much, how fast and how long is left', async () => {
    const drawn = await render(<DownloadReadout progress={PROGRESS} />);

    expect(drawn.getByText('25% · 512 MB of 2.0 GB · 5.0 MB/s · 10 min left')).toBeTruthy();
  });

  it('says only how far through where nothing else is known', async () => {
    const drawn = await render(
      <DownloadReadout
        progress={{
          ...PROGRESS,
          sizeBytes: null,
          doneBytes: null,
          downloadBytesPerSecond: null,
          secondsLeft: null,
        }}
      />,
    );

    expect(drawn.getByText('25%')).toBeTruthy();
  });

  it('draws its words dark on a white row', async () => {
    const drawn = await render(<DownloadReadout progress={PROGRESS} isOnWhite />);

    expect(drawn.getByText(/^25%/)).toHaveStyle({ color: tokens.colours.onWhite });
  });
});
