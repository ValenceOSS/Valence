import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualStripDemo } from './VirtualStripDemo';

describe('VirtualStripDemo', () => {
  it('draws the strip', () => {
    render(<VirtualStripDemo />);

    expect(screen.getByLabelText('A thousand lines')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VirtualStripDemo.displayName).toBe('VirtualStripDemo');
  });
});
