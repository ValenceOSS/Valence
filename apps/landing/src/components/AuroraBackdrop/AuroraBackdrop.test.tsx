import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuroraBackdrop } from './AuroraBackdrop';

describe('AuroraBackdrop', () => {
  it('draws the moving light behind whatever holds it', () => {
    render(<AuroraBackdrop />);

    expect(screen.getByTestId('shader-mount')).toHaveClass('absolute', 'inset-0', '-z-10');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AuroraBackdrop.displayName).toBe('AuroraBackdrop');
  });
});
