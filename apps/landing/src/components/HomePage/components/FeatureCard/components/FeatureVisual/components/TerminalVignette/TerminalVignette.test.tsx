import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TerminalVignette } from './TerminalVignette';

describe('TerminalVignette', () => {
  it('starts the server from one command', () => {
    render(<TerminalVignette />);

    expect(screen.getAllByText('Terminal')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TerminalVignette.displayName).toBe('TerminalVignette');
  });
});
