import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthPicture } from './AuthPicture';

describe('AuthPicture', () => {
  it('asks for the code from an authenticator app, with a passkey instead', () => {
    render(<AuthPicture />);

    expect(screen.getAllByText('Use a passkey instead')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AuthPicture.displayName).toBe('AuthPicture');
  });
});
