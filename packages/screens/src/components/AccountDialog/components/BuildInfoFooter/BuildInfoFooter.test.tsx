import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { BuildInfoFooter } from './BuildInfoFooter';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const draw = () => render(<BuildInfoFooter />, { wrapper: CacheScope });

describe('BuildInfoFooter', () => {
  it('draws nothing on a client with no build to report and no answer from a server', () => {
    draw();

    expect(screen.queryByText(/Electron/u)).not.toBeInTheDocument();
  });

  it('names the version, commit, architecture and runtime this client was built with', () => {
    installATestClient({
      buildInfo: () => ({
        version: '1.2.0',
        commit: '2ae1bc1',
        runsOn: 'arm64 · Electron 33.0.0 · Chromium 130.0.0',
      }),
    });

    draw();

    expect(
      screen.getByText('Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0'),
    ).toBeInTheDocument();
  });

  it('names what the server answering it is running, alongside what this client is', async () => {
    installATestClient({
      buildInfo: () => ({
        version: '1.2.0',
        commit: '2ae1bc1',
        runsOn: 'arm64 · Electron 33.0.0 · Chromium 130.0.0',
      }),
    });

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ commit: 'f00cafe' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    draw();

    await waitFor(() => {
      expect(screen.getByText(/Server f00cafe/u)).toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BuildInfoFooter.displayName).toBe('BuildInfoFooter');
  });
});
