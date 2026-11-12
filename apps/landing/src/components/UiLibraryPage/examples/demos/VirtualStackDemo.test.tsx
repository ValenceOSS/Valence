import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualStackDemo } from './VirtualStackDemo';

describe('VirtualStackDemo', () => {
  it('draws the stack', () => {
    render(<VirtualStackDemo />);

    expect(screen.getByLabelText('Sixty blocks')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VirtualStackDemo.displayName).toBe('VirtualStackDemo');
  });
});
