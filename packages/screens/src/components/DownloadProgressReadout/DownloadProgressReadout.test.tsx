import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DownloadProgressReadout } from './DownloadProgressReadout';

const GOING = {
  downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  state: 'downloading' as const,
  progress: 0.5,
  sizeBytes: 4 * 1024 ** 3,
  doneBytes: 2 * 1024 ** 3,
  downloadBytesPerSecond: 3 * 1024 ** 2,
  secondsLeft: 720,
};

describe('DownloadProgressReadout', () => {
  it('says the percentage, then how much has arrived, how fast and how long is left', () => {
    const { container } = render(<DownloadProgressReadout progress={GOING} />);

    expect(container).toHaveTextContent('50% · 2.0 GB of 4.0 GB · 3.0 MB/s · 12 min left');
  });

  it('says only the percentage where nothing else is known', () => {
    const { container } = render(
      <DownloadProgressReadout
        progress={{ ...GOING, sizeBytes: null, downloadBytesPerSecond: null, secondsLeft: null }}
      />,
    );

    expect(container).toHaveTextContent(/^50%$/);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadProgressReadout.displayName).toBe('DownloadProgressReadout');
  });
});
