import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReleaseEntry } from './ReleaseEntry';

const RELEASE = {
  version: '1.6.0',
  publishedAt: '2026-10-13T17:31:20Z',
  notes: '### Added\n\n* a redesigned player',
  url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.6.0',
  isNewer: false,
  isCurrent: true,
};

const NOW = Date.parse('2026-10-17T03:00:00Z');

describe('ReleaseEntry', () => {
  it('shows what changed in a release that starts open, and marks the one this server runs', () => {
    render(
      <ul>
        <ReleaseEntry release={RELEASE} isOpenAtFirst now={NOW} />
      </ul>,
    );

    expect([
      screen.getByText('A redesigned player').textContent,
      screen.getByText('This server').textContent,
    ]).toEqual(['A redesigned player', 'This server']);
  });

  it('keeps an older release folded until it is opened', () => {
    render(
      <ul>
        <ReleaseEntry release={{ ...RELEASE, isCurrent: false }} isOpenAtFirst={false} now={NOW} />
      </ul>,
    );

    expect(screen.queryByText('A redesigned player')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show what changed in 1.6.0' }));

    expect(screen.getByText('A redesigned player')).toBeInTheDocument();
  });

  it('marks a release newer than this server runs', () => {
    render(
      <ul>
        <ReleaseEntry
          release={{ ...RELEASE, version: '1.7.0', isNewer: true, isCurrent: false }}
          isOpenAtFirst={false}
          now={NOW}
        />
      </ul>,
    );

    expect(screen.getByText('Newer')).toBeInTheDocument();
  });
});
