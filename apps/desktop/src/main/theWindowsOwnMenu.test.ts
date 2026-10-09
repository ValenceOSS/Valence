import { describe, expect, it, vi } from 'vitest';
import { theWindowsOwnMenu } from './theWindowsOwnMenu';

describe('theWindowsOwnMenu', () => {
  it('raises no menu on a right click', () => {
    let rightClick = (_event: { preventDefault: () => void }): void => undefined;
    const event = { preventDefault: vi.fn() };

    theWindowsOwnMenu({
      webContents: {
        on: (_event, listener) => {
          rightClick = listener;
        },
      },
    });

    rightClick(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });
});
