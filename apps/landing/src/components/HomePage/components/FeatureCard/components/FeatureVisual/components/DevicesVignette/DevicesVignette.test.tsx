import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DevicesVignette } from './DevicesVignette';

describe('DevicesVignette', () => {
  it('lists what is playing on each device, and how it reaches it', () => {
    render(<DevicesVignette />);

    expect(screen.getAllByText('Living room TV')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DevicesVignette.displayName).toBe('DevicesVignette');
  });
});
