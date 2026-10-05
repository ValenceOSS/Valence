import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TerminalPicture } from './TerminalPicture';

describe('TerminalPicture', () => {
  it('starts the server from one command', () => {
    render(<TerminalPicture />);

    expect(screen.getAllByText('Terminal')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TerminalPicture.displayName).toBe('TerminalPicture');
  });
});
