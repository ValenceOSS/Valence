import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SplashScreenDemo } from './SplashScreenDemo';

describe('SplashScreenDemo', () => {
  it('offers a replay', () => {
    render(<SplashScreenDemo />);

    expect(screen.getByRole('button', { name: 'Replay' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SplashScreenDemo.displayName).toBe('SplashScreenDemo');
  });
});
