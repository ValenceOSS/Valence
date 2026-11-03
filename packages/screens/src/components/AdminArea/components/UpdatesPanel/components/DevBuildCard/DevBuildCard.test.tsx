import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DevBuildCheck } from '@ValenceContracts/schemas/DevBuildCheck';
import { DevBuildCard } from './DevBuildCard';

const DEV: DevBuildCheck = {
  commit: 'd3eee1d',
  newest: '1806279',
  builtAt: '2026-11-03T14:41:22Z',
  isNewer: true,
  isOffMain: false,
  behindBy: 1,
  commits: [
    {
      sha: '1806279',
      subject: 'fix: admin badges count what their pages list (#797)',
      committedAt: null,
      url: 'https://github.com/ValenceOSS/Valence/commit/1806279',
    },
  ],
  problem: null,
};

describe('DevBuildCard', () => {
  it('links each change by its title, and names its commit', () => {
    render(<DevBuildCard dev={DEV} now={Date.parse('2026-11-03T15:00:00Z')} />);

    expect(screen.getByText('1 commit on main since this build')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'fix: admin badges count what their pages list (#797)' }),
    ).toHaveAttribute('href', 'https://github.com/ValenceOSS/Valence/commit/1806279');
    expect(screen.getByText('1806279')).toBeInTheDocument();
    expect(screen.queryByText(/more commit/)).not.toBeInTheDocument();
  });
});
