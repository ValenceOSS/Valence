import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualGridDemo } from './VirtualGridDemo';

describe('VirtualGridDemo', () => {
  it('draws the grid', () => {
    render(<VirtualGridDemo />);

    expect(screen.getByLabelText('A hundred cards')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VirtualGridDemo.displayName).toBe('VirtualGridDemo');
  });
});
