import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { answerTheShortcuts } from './answerTheShortcuts';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(() => Promise.resolve(null)) }));

const stops: (() => void)[] = [];

afterEach(() => {
  for (const stop of stops.splice(0)) {
    stop();
  }

  vi.mocked(invoke).mockClear();
});

/**
 * Presses keys in the page, as the webview would hand them to it.
 *
 * @param init - The keys.
 * @param target - Where the keys are pressed.
 * @returns The event, to see whether it was kept from the webview.
 */
const press = (init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent => {
  const pressed = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });

  target.dispatchEvent(pressed);

  return pressed;
};

describe('answerTheShortcuts', () => {
  it('asks the host for the menu item a shortcut stands for, and keeps the key from the webview', () => {
    stops.push(answerTheShortcuts(window, 'win32'));

    const pressed = press({ key: '=', code: 'Equal', ctrlKey: true });

    expect(invoke).toHaveBeenCalledWith('press_a_shortcut', { shortcut: 'zoom-in' });
    expect(pressed.defaultPrevented).toBe(true);
  });

  it('leaves the page every key that is not a shortcut', () => {
    stops.push(answerTheShortcuts(window, 'linux'));

    const pressed = press({ key: 'f', code: 'KeyF' });

    expect(invoke).not.toHaveBeenCalled();
    expect(pressed.defaultPrevented).toBe(false);
  });

  it('leaves a key the page already used to the page', () => {
    stops.push(answerTheShortcuts(window, 'linux'));

    const field = document.createElement('input');

    document.body.append(field);
    field.addEventListener('keydown', (event) => {
      event.preventDefault();
    });

    press({ key: 'r', code: 'KeyR', ctrlKey: true }, field);
    field.remove();

    expect(invoke).not.toHaveBeenCalled();
  });

  it('answers a held key only for zooming', () => {
    stops.push(answerTheShortcuts(window, 'linux'));

    press({ key: 'r', code: 'KeyR', ctrlKey: true, repeat: true });
    press({ key: '-', code: 'Minus', ctrlKey: true, repeat: true });

    expect(invoke).toHaveBeenCalledOnce();
    expect(invoke).toHaveBeenCalledWith('press_a_shortcut', { shortcut: 'zoom-out' });
  });

  it('answers nothing while a word is being composed', () => {
    stops.push(answerTheShortcuts(window, 'linux'));

    press({ key: 'w', code: 'KeyW', ctrlKey: true, isComposing: true });

    expect(invoke).not.toHaveBeenCalled();
  });

  it('answers nothing on a Mac, whose menu bar hears its own shortcuts', () => {
    stops.push(answerTheShortcuts(window, 'darwin'));

    press({ key: 'r', code: 'KeyR', metaKey: true });
    press({ key: 'r', code: 'KeyR', ctrlKey: true });

    expect(invoke).not.toHaveBeenCalled();
  });

  it('stops answering once told to', () => {
    answerTheShortcuts(window, 'win32')();

    press({ key: 'F11', code: 'F11' });

    expect(invoke).not.toHaveBeenCalled();
  });
});
