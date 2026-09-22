import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { BuildInfoFooter } from './BuildInfoFooter';

describe('BuildInfoFooter', () => {
  it('draws nothing on a client with no build to report', () => {
    render(<BuildInfoFooter />);

    expect(screen.queryByText(/Electron/u)).not.toBeInTheDocument();
  });

  it('names the version, commit, architecture and runtime this client was built with', () => {
    installATestClient({
      buildInfo: () => ({
        version: '1.2.0',
        commit: '2ae1bc1',
        arch: 'arm64',
        electron: '33.0.0',
        chrome: '130.0.0',
      }),
    });

    render(<BuildInfoFooter />);

    expect(
      screen.getByText('Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BuildInfoFooter.displayName).toBe('BuildInfoFooter');
  });
});
