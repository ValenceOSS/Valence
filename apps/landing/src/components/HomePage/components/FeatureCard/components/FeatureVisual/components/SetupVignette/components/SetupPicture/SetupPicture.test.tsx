import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SetupPicture } from './SetupPicture';

describe('SetupPicture', () => {
  it('walks through setting a server up, step by step', () => {
    render(<SetupPicture />);

    expect(screen.getAllByText('Trusted origins')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SetupPicture.displayName).toBe('SetupPicture');
  });
});
