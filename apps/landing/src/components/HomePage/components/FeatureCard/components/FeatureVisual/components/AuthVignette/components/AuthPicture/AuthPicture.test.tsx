import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthPicture } from './AuthPicture';

describe('AuthPicture', () => {
  it('asks for the code from an authenticator app, as the app does', () => {
    render(<AuthPicture />);

    expect(screen.getByLabelText('Authenticator code')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument();
  });

  it('shows the code as it is typed', () => {
    const { rerender } = render(<AuthPicture typed="48" />);

    expect(screen.getByLabelText('Authenticator code')).toHaveValue('48');

    rerender(<AuthPicture typed="481073" />);

    expect(screen.getByLabelText('Authenticator code')).toHaveValue('481073');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AuthPicture.displayName).toBe('AuthPicture');
  });
});
