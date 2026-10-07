import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataOwnershipStatement } from './DataOwnershipStatement';

const WHITESPACE_RUN = /\s+/gu;

describe('DataOwnershipStatement', () => {
  it('names the section for anybody skipping between landmarks', () => {
    render(<DataOwnershipStatement />);

    expect(screen.getByRole('region', { name: 'On your data' })).toBeInTheDocument();
  });

  it('says the whole statement, in order, however it is drawn', () => {
    render(<DataOwnershipStatement />);

    const region = screen.getByRole('region', { name: 'On your data' });
    const statement = region.querySelector('p');
    const collapsed = (statement?.textContent ?? '').replace(WHITESPACE_RUN, ' ').trim();

    expect(collapsed).toBe(
      'Your #library stays yours. So does what you watch, when you watch it, and who with. It all lives on your server, and with Valence, it never leaves.',
    );
  });

  it('notes beside it that nothing is sent home', () => {
    render(<DataOwnershipStatement />);

    expect(screen.getByText('Did you know...')).toBeInTheDocument();
    expect(screen.getByText(/Valence sends us nothing/u)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DataOwnershipStatement.displayName).toBe('DataOwnershipStatement');
  });
});
