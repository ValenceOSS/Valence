import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useTurnKeys } from './useTurnKeys';

/**
 * Listens for turning keys the way a reader does.
 */
const listen = (isRightToLeft: boolean) => {
  const keys = { forward: vi.fn(), back: vi.fn(), onClose: vi.fn() };

  renderHook(() => {
    useTurnKeys({ isRightToLeft, ...keys });
  });

  return keys;
};

describe('useTurnKeys', () => {
  it('turns on with the right arrow in a book read left to right', async () => {
    const keys = listen(false);

    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowLeft}');

    expect(keys.forward).toHaveBeenCalledTimes(1);
    expect(keys.back).toHaveBeenCalledTimes(1);
  });

  it('turns on with the left arrow in a book read right to left', async () => {
    const keys = listen(true);

    await userEvent.keyboard('{ArrowLeft}');

    expect(keys.forward).toHaveBeenCalledTimes(1);
    expect(keys.back).not.toHaveBeenCalled();
  });

  it('turns on with down, space and page down, whichever way the book is read', async () => {
    const keys = listen(true);

    await userEvent.keyboard('{ArrowDown}{ }{PageDown}');

    expect(keys.forward).toHaveBeenCalledTimes(3);
  });

  it('turns back with up and page up', async () => {
    const keys = listen(false);

    await userEvent.keyboard('{ArrowUp}{PageUp}');

    expect(keys.back).toHaveBeenCalledTimes(2);
  });

  it('leaves on escape', async () => {
    const keys = listen(false);

    await userEvent.keyboard('{Escape}');

    expect(keys.onClose).toHaveBeenCalled();
    expect(keys.forward).not.toHaveBeenCalled();
  });
});
