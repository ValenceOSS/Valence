import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeviceStage } from './DeviceStage';

describe('DeviceStage', () => {
  it('shows the web app', () => {
    render(<DeviceStage />);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app's home page, with a film in the featured row",
      }),
    ).toHaveAttribute('src', '/devices/web.jpg');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DeviceStage.displayName).toBe('DeviceStage');
  });
});
