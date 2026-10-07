import { describe, expect, it } from 'vitest';
import { brandMarksOf } from './brandMarksOf';

describe('brandMarksOf', () => {
  it('reads the browser from the start of a label and the system from its end', () => {
    expect(brandMarksOf('Firefox on Linux')).toEqual({ browser: 'firefox', system: 'linux' });
    expect(brandMarksOf('Safari on iOS')).toEqual({ browser: 'safari', system: 'apple' });
  });

  it('shows Chromium as Chrome, the browser built on it that almost always is', () => {
    expect(brandMarksOf('Chromium on macOS')).toEqual({ browser: 'chrome', system: 'apple' });
  });

  it('tells Opera apart from the Chromium it is built on', () => {
    expect(brandMarksOf('Opera on Android').browser).toBe('opera');
  });

  it('reads the Android an Android phone says it runs, whatever the phone is called', () => {
    expect(brandMarksOf('Pixel 10 Pro on Android')).toEqual({ browser: null, system: 'android' });
    expect(brandMarksOf('Emulator on Android').system).toBe('android');
  });

  it('knows an LG or Samsung television showing the TV layout by its maker’s mark', () => {
    expect(brandMarksOf('LG TV')).toEqual({ browser: null, system: 'lg' });
    expect(brandMarksOf('Samsung TV')).toEqual({ browser: null, system: 'samsung' });
  });

  it('answers no mark for an Xbox, whose maker asked for its marks to go', () => {
    expect(brandMarksOf('Xbox')).toEqual({ browser: null, system: null });
  });

  it('knows Windows by its mark', () => {
    expect(brandMarksOf('Chromium on Windows')).toEqual({ browser: 'chrome', system: 'windows' });
  });

  it('answers no mark for a browser without one of its own', () => {
    expect(brandMarksOf('Edge on Windows')).toEqual({ browser: null, system: 'windows' });
  });
});
