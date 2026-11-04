import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useShortcut } from './useShortcut';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useShortcut', () => {
  it('presses on its key, in either case, and not with a modifier held', async () => {
    const onPress = vi.fn();
    const heard = vi.fn((event: KeyboardEvent) => event.defaultPrevented);

    renderHook(() => {
      useShortcut('J', onPress);
    });
    window.addEventListener('keydown', heard);

    await userEvent.keyboard('j');

    window.removeEventListener('keydown', heard);
    expect(heard).toHaveReturnedWith(true);

    await userEvent.keyboard('J');
    await userEvent.keyboard('{Meta>}j{/Meta}');
    await userEvent.keyboard('k');

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('stays quiet while somebody types, or a dialog is open', async () => {
    const onPress = vi.fn();
    const field = document.createElement('input');

    document.body.append(field);
    renderHook(() => {
      useShortcut('J', onPress);
    });

    field.focus();
    await userEvent.keyboard('j');
    field.blur();

    const dialog = document.createElement('div');

    dialog.setAttribute('role', 'dialog');
    document.body.append(dialog);
    await userEvent.keyboard('j');

    expect(onPress).not.toHaveBeenCalled();
  });

  it('leaves the key alone where it has nothing to do', async () => {
    const heard = vi.fn((event: KeyboardEvent) => event.defaultPrevented);

    renderHook(() => {
      useShortcut('J', undefined);
    });
    window.addEventListener('keydown', heard);

    await userEvent.keyboard('j');
    window.removeEventListener('keydown', heard);

    expect(heard).toHaveReturnedWith(false);
  });
});
