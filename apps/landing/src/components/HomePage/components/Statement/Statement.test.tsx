import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Statement } from './Statement';

describe('Statement', () => {
  it('names the section for anybody skipping between landmarks', () => {
    render(<Statement />);

    expect(screen.getByRole('region', { name: 'On your data' })).toBeInTheDocument();
  });

  it('leads with whose library it is, set apart from the rest', () => {
    render(<Statement />);

    const lead = screen.getByText('Your library stays yours.');

    expect(lead).toHaveClass('text-text');
    expect(lead.parentElement?.textContent).toContain(
      'shared with the people you choose, and nobody else’s server in the way.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Statement.displayName).toBe('Statement');
  });
});
