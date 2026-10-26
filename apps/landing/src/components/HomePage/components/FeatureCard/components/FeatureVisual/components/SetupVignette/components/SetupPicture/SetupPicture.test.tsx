import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SetupPicture } from './SetupPicture';

describe('SetupPicture', () => {
  it('walks through setting a server up, step by step', () => {
    render(<SetupPicture />);

    expect(screen.getByRole('navigation', { name: 'Set up Valence' })).toBeInTheDocument();
    expect(screen.getByLabelText('Trusted origins')).toHaveValue('https://watch.home.lan');
  });

  it('moves on to the libraries', () => {
    render(<SetupPicture isOnLibraries />);

    expect(screen.getAllByText('Libraries')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SetupPicture.displayName).toBe('SetupPicture');
  });
});
