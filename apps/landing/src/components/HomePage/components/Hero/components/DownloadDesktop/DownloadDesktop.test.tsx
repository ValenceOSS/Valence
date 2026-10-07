import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DownloadDesktop } from './DownloadDesktop';
import type { LatestRelease } from '@ValenceLanding/content/downloads/latestRelease';

const installer = (name: string) => ({
  name,
  url: `https://example.com/${name}`,
  sizeBytes: 150_000_000,
});

const RELEASE: LatestRelease = {
  version: 'v1.3.0',
  publishedAt: '2026-10-03',
  url: 'https://example.com/release',
  installers: {
    macAppleSilicon: installer('Valence-1.3.0-arm64.dmg'),
    macIntel: installer('Valence-1.3.0-x64.dmg'),
    windows: installer('Valence-Setup-1.3.0.exe'),
    windowsArm: null,
    linux: installer('Valence-1.3.0.AppImage'),
    linuxArm: null,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DownloadDesktop', () => {
  it('downloads the installer for the computer it is open on', async () => {
    const assign = vi.fn();

    vi.stubGlobal('location', { ...window.location, assign });

    const user = userEvent.setup();

    render(<DownloadDesktop release={RELEASE} platform="windows" />);

    await user.click(screen.getByRole('button', { name: /Download Desktop/ }));

    expect(assign).toHaveBeenCalledWith('https://example.com/Valence-Setup-1.3.0.exe');
  });

  it('lists every installer, with its processor, behind the arrow', async () => {
    const user = userEvent.setup();

    render(<DownloadDesktop release={RELEASE} platform="mac" />);

    await user.click(screen.getByRole('button', { name: 'Other computers' }));

    expect(await screen.findByText(/Apple silicon · arm64/)).toBeInTheDocument();
    expect(screen.getByText(/Intel · x64/)).toBeInTheDocument();
    expect(screen.getByText(/Installer · x64/)).toBeInTheDocument();
    expect(screen.getByText(/AppImage · x64/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadDesktop.displayName).toBe('DownloadDesktop');
  });
});
