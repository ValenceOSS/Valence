import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DownloadRow } from './DownloadRow';

describe('DownloadRow', () => {
  it('names the computer and the file, and links to the download', () => {
    render(
      <ul>
        <DownloadRow
          choice={{
            id: 'windows',
            system: 'Windows',
            detail: '64-bit installer',
            url: 'https://example.test/setup.exe',
            fileName: 'Valence-Setup-1.1.2.exe',
            sizeBytes: 1024 * 1024 * 90,
          }}
        />
      </ul>,
    );

    expect(screen.getByText(/Valence-Setup-1\.1\.2\.exe/u)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Download for Windows, 64-bit installer' }),
    ).toHaveAttribute('href', 'https://example.test/setup.exe');
  });

  it('sends a download the release does not carry to its page', () => {
    render(
      <ul>
        <DownloadRow
          choice={{
            id: 'linux',
            system: 'Linux',
            detail: 'AppImage',
            url: 'https://github.com/ValenceOSS/Valence/releases/latest',
            fileName: null,
            sizeBytes: null,
          }}
        />
      </ul>,
    );

    expect(screen.getByText('On the release page')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadRow.displayName).toBe('DownloadRow');
  });
});
