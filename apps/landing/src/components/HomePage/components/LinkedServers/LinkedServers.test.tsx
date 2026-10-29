import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinkedServers } from './LinkedServers';

describe('LinkedServers', () => {
  it('draws two linked servers beside what linking does', () => {
    render(<LinkedServers />);

    expect(screen.getByRole('heading', { level: 2, name: /Two households/ })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Linked')).toBeInTheDocument();
    expect(screen.getByText('Known by a key, not an address')).toBeInTheDocument();
  });

  it('leads to the docs on linking', () => {
    render(<LinkedServers />);

    expect(screen.getByRole('link', { name: /How linking works/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/use/linked-servers'),
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LinkedServers.displayName).toBe('LinkedServers');
  });
});
