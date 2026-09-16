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
    const collapsed = (region.textContent ?? '').replace(WHITESPACE_RUN, ' ').trim();

    expect(collapsed).toBe(
      'Your #library is yours. Your history is yours. Nothing about how you watch should leave the server you run, so with Valence, it never does.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DataOwnershipStatement.displayName).toBe('DataOwnershipStatement');
  });
});
