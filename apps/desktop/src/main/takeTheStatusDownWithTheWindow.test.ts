import { describe, expect, it, vi } from 'vitest';
import { takeTheStatusDownWithTheWindow } from './takeTheStatusDownWithTheWindow';

describe('takeTheStatusDownWithTheWindow', () => {
  it('clears the status once the window is closed, and not before', () => {
    let close = (): void => undefined;
    const discord = { about: vi.fn() };

    takeTheStatusDownWithTheWindow(
      {
        on: (_event, listener) => {
          close = listener;
        },
      },
      discord,
    );

    expect(discord.about).not.toHaveBeenCalled();

    close();

    expect(discord.about).toHaveBeenCalledWith(null);
  });
});
