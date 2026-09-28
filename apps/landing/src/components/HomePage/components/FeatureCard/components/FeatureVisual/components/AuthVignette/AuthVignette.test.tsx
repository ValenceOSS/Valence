import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthVignette } from './AuthVignette';

describe('AuthVignette', () => {
  it('asks for the code from an authenticator app, with a passkey instead', () => {
    render(<AuthVignette />);

    expect(screen.getAllByText('Use a passkey instead')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AuthVignette.displayName).toBe('AuthVignette');
  });
});
