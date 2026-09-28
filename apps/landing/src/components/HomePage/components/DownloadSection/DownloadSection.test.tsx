import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DownloadSection } from './DownloadSection';

const onA = (userAgent: string) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DownloadSection', () => {
  it('leads with the desktop app for the visitor’s own computer', () => {
    onA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

    render(<DownloadSection />);

    expect(screen.getByRole('button', { name: 'Download for Windows' })).toBeInTheDocument();
    expect(screen.getByText('Other platforms')).toBeInTheDocument();
  });

  it('offers a Mac the Intel build beside Apple silicon', () => {
    onA('Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6)');

    render(<DownloadSection />);

    expect(screen.getByRole('button', { name: 'Download for macOS' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download for Intel' })).toBeInTheDocument();
  });

  it('asks which computer where it cannot tell, and shows a phone the phone first', () => {
    onA('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)');

    render(<DownloadSection />);

    const section = screen.getByRole('region', { name: 'Download' });

    expect(within(section).getByText('Choose your computer')).toBeInTheDocument();
    expect(
      within(section)
        .getAllByText(/Phones|Desktop/u)
        .map((node) => node.textContent),
    ).toEqual(['Phones', 'Desktop']);
  });

  it('gives the commands that start a server, and where to read more', () => {
    onA('Mozilla/5.0 (X11; Linux x86_64)');

    render(<DownloadSection />);

    expect(
      screen.getByRole('figure', { name: 'Commands that start a Valence server' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The complete compose file' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Set it up with an AI assistant' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadSection.displayName).toBe('DownloadSection');
  });
});
