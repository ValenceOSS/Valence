import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangelogRelease } from './ChangelogRelease';
import type { Release } from '@ValenceLanding/content/githubRelease';

const RELEASE: Release = {
  version: 'v1.2.0',
  title: 'A real release',
  body: 'Fixed a bug (#123). See also [the docs](https://example.com/docs).',
  publishedAt: '2026-01-05',
  url: 'https://github.com/MarquesCoding/Valence/releases/tag/v1.2.0',
  isPrerelease: false,
};

describe('ChangelogRelease', () => {
  it('names the version and the date it shipped', () => {
    render(<ChangelogRelease release={RELEASE} index={0} />);

    expect(screen.getByRole('heading', { name: 'A real release' })).toBeInTheDocument();
    expect(screen.getAllByText('v1.2.0').length).toBeGreaterThan(0);
    expect(screen.getByText('2026-01-05')).toBeInTheDocument();
  });

  it('says nothing about a date it does not have', () => {
    render(<ChangelogRelease release={{ ...RELEASE, publishedAt: null }} index={0} />);

    expect(screen.queryByText('2026-01-05')).not.toBeInTheDocument();
  });

  it('marks a prerelease as one, in the banner and beside its version', () => {
    render(<ChangelogRelease release={{ ...RELEASE, isPrerelease: true }} index={0} />);

    expect(screen.getByText('Prerelease v1.2.0')).toBeInTheDocument();
    expect(screen.getByText('Prerelease', { selector: 'span' })).toBeInTheDocument();
  });

  it('turns a pull request link into a badge rather than a raw URL', () => {
    render(
      <ChangelogRelease
        release={{
          ...RELEASE,
          body: 'Fixed a bug ([#123](https://github.com/MarquesCoding/Valence/pull/123)).',
        }}
        index={0}
      />,
    );

    const link = screen.getByRole('link', { name: /Pull 123/ });

    expect(link).toHaveAttribute('href', 'https://github.com/MarquesCoding/Valence/pull/123');
  });

  it('leaves an ordinary link as itself', () => {
    render(<ChangelogRelease release={RELEASE} index={0} />);

    expect(screen.getByRole('link', { name: 'the docs' })).toHaveAttribute(
      'href',
      'https://example.com/docs',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChangelogRelease.displayName).toBe('ChangelogRelease');
  });
});
