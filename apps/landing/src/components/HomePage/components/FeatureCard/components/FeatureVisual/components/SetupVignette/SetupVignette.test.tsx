import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SetupVignette } from './SetupVignette';

describe('SetupVignette', () => {
  it('walks through setting a server up, step by step', () => {
    render(<SetupVignette />);

    expect(screen.getAllByText('Trusted origins')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SetupVignette.displayName).toBe('SetupVignette');
  });
});
