import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeviceFrame } from './DeviceFrame';

describe('DeviceFrame', () => {
  it('draws the screenshot, named for what it shows', () => {
    render(
      <DeviceFrame shape="browser" src="/devices/web.jpg" alt="The web app" className="w-1/2" />,
    );

    const picture = screen.getByRole('img', { name: 'The web app' });
    const rim = picture.parentElement;

    expect(picture).toHaveAttribute('src', '/devices/web.jpg');
    expect(rim).toHaveAttribute('data-shape', 'browser');
    expect(rim).toHaveClass('valence-glass', 'w-1/2');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DeviceFrame.displayName).toBe('DeviceFrame');
  });
});
