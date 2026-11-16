import { describe, expect, it } from 'vitest';
import { shortcutFor } from './shortcutFor';

/**
 * Keys pressed with Control held, and nothing else unless asked.
 *
 * @param key - The key.
 * @param also - What else was held, and where the key sits.
 * @returns The keys.
 */
const withControl = (
  key: string,
  also: { shiftKey?: boolean; altKey?: boolean; metaKey?: boolean; code?: string } = {},
) => ({
  key,
  code: also.code ?? '',
  ctrlKey: true,
  shiftKey: also.shiftKey ?? false,
  altKey: also.altKey ?? false,
  metaKey: also.metaKey ?? false,
});

describe('shortcutFor', () => {
  it('answers every shortcut the menu answered on Windows and Linux', () => {
    for (const platform of ['win32', 'linux']) {
      expect(shortcutFor(withControl('S', { shiftKey: true }), platform)).toBe('change-server');
      expect(shortcutFor(withControl('r'), platform)).toBe('reload');
      expect(shortcutFor(withControl('R', { shiftKey: true }), platform)).toBe('force-reload');
      expect(shortcutFor(withControl('I', { shiftKey: true }), platform)).toBe('toggle-dev-tools');
      expect(shortcutFor(withControl('0'), platform)).toBe('actual-size');
      expect(shortcutFor(withControl('m'), platform)).toBe('minimise');
      expect(shortcutFor(withControl('w'), platform)).toBe('close-window');
      expect(
        shortcutFor(
          {
            key: 'F11',
            code: 'F11',
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
          },
          platform,
        ),
      ).toBe('toggle-full-screen');
    }
  });

  it('zooms with the plus and minus keys, whether shifted or on the number pad', () => {
    expect(shortcutFor(withControl('='), 'win32')).toBe('zoom-in');
    expect(shortcutFor(withControl('+', { shiftKey: true }), 'win32')).toBe('zoom-in');
    expect(shortcutFor(withControl('+', { code: 'NumpadAdd' }), 'linux')).toBe('zoom-in');
    expect(shortcutFor(withControl('-'), 'win32')).toBe('zoom-out');
    expect(shortcutFor(withControl('_', { shiftKey: true }), 'linux')).toBe('zoom-out');
  });

  it('quits with Control and Q on Linux only, as Electron did', () => {
    expect(shortcutFor(withControl('q'), 'linux')).toBe('quit');
    expect(shortcutFor(withControl('q'), 'win32')).toBeNull();
  });

  it('reads a letter from where it sits on a keyboard that writes another alphabet', () => {
    expect(shortcutFor(withControl('к', { code: 'KeyR' }), 'linux')).toBe('reload');
    expect(shortcutFor(withControl('Ы', { shiftKey: true, code: 'KeyS' }), 'win32')).toBe(
      'change-server',
    );
  });

  it('leaves a Mac to its menu bar', () => {
    expect(shortcutFor(withControl('r'), 'darwin')).toBeNull();
    expect(
      shortcutFor(
        { key: 'F11', code: 'F11', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
        'darwin',
      ),
    ).toBeNull();
  });

  it('leaves combinations of Alt, AltGr and the Windows key alone', () => {
    expect(shortcutFor(withControl('0', { altKey: true }), 'win32')).toBeNull();
    expect(shortcutFor(withControl('r', { metaKey: true }), 'linux')).toBeNull();
  });

  it('answers nothing for keys that are no shortcut of the menu', () => {
    expect(shortcutFor(withControl('s'), 'win32')).toBeNull();
    expect(shortcutFor(withControl('i'), 'win32')).toBeNull();
    expect(shortcutFor(withControl(')', { shiftKey: true }), 'win32')).toBeNull();
    expect(shortcutFor(withControl('M', { shiftKey: true }), 'win32')).toBeNull();
    expect(shortcutFor(withControl('W', { shiftKey: true }), 'win32')).toBeNull();
    expect(shortcutFor(withControl('Q', { shiftKey: true }), 'linux')).toBeNull();
    expect(shortcutFor(withControl('c'), 'linux')).toBeNull();
    expect(
      shortcutFor(
        { key: 'f', code: 'KeyF', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
        'linux',
      ),
    ).toBeNull();
    expect(
      shortcutFor(
        { key: 'F11', code: 'F11', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false },
        'linux',
      ),
    ).toBeNull();
  });
});
