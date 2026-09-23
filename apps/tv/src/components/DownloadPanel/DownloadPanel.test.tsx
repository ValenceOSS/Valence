import { render } from '@testing-library/react-native';
import { DownloadPanel } from '@ValenceTv/components/DownloadPanel/DownloadPanel';
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

describe('DownloadPanel', () => {
  it('says where the request stands and how far through it is', async () => {
    const drawn = await render(<DownloadPanel label="Downloading" progress={PROGRESS} />);

    expect(drawn.getByText('Downloading')).toBeTruthy();
    expect(drawn.getByText('25%')).toBeTruthy();
  });

  it('names how much has arrived, how fast and how long is left', async () => {
    const drawn = await render(<DownloadPanel label="Downloading" progress={PROGRESS} />);

    expect(drawn.getByText('Downloaded')).toBeTruthy();
    expect(drawn.getByText('512 MB of 2.0 GB')).toBeTruthy();
    expect(drawn.getByText('Speed')).toBeTruthy();
    expect(drawn.getByText('5.0 MB/s')).toBeTruthy();
    expect(drawn.getByText('Time left')).toBeTruthy();
    expect(drawn.getByText('10 min')).toBeTruthy();
  });

  it('leaves out what the server does not know', async () => {
    const drawn = await render(
      <DownloadPanel
        label="Downloading"
        progress={{ ...PROGRESS, downloadBytesPerSecond: 0, secondsLeft: null }}
      />,
    );

    expect(drawn.getByText('Downloaded')).toBeTruthy();
    expect(drawn.queryByText('Speed')).toBeNull();
    expect(drawn.queryByText('Time left')).toBeNull();
  });

  it('names nothing beneath the bar where nothing is known', async () => {
    const drawn = await render(
      <DownloadPanel
        label="Queued"
        progress={{
          ...PROGRESS,
          progress: 0,
          sizeBytes: null,
          doneBytes: null,
          downloadBytesPerSecond: null,
          secondsLeft: null,
        }}
      />,
    );

    expect(drawn.getByText('0%')).toBeTruthy();
    expect(drawn.queryByText('Downloaded')).toBeNull();
  });
});
