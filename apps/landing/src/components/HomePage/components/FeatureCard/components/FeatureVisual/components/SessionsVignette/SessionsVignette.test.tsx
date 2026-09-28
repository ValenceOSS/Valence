import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionsVignette } from './SessionsVignette';

describe('SessionsVignette', () => {
  it('lists who is watching what, right now', () => {
    render(<SessionsVignette />);

    expect(screen.getAllByText('Harbour Lights')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionsVignette.displayName).toBe('SessionsVignette');
  });
});
