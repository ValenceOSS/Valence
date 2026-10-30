import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoomLayer } from './RoomLayer';

describe('RoomLayer', () => {
  it('draws the room as a picture assistive technology passes over', () => {
    const { container } = render(<RoomLayer />);
    const room = container.querySelector('img');

    expect(room).toHaveAttribute('src', '/hero/living-room.jpg');
    expect(room).toHaveAttribute('alt', '');
    expect(room?.getAttribute('srcset')).toContain('/hero/living-room-1600.webp 1600w');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoomLayer.displayName).toBe('RoomLayer');
  });
});
