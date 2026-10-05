import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionsPicture } from './SessionsPicture';

describe('SessionsPicture', () => {
  it('lists who is watching what, right now', () => {
    render(<SessionsPicture />);

    expect(screen.getAllByText('Harbour Lights')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionsPicture.displayName).toBe('SessionsPicture');
  });
});
