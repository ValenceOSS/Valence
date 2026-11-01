import { describe, expect, it } from 'vitest';
import { systemOf } from './systemOf';

describe('systemOf', () => {
  it('names an iPhone and an iPad by name, though both claim to be like a Mac', () => {
    expect(
      systemOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15'),
    ).toEqual({ system: 'ios', form: 'phone' });
    expect(systemOf('Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15')).toEqual({
      system: 'ipados',
      form: 'tablet',
    });
  });

  it('tells an Android phone from an Android tablet by whether it says it is mobile', () => {
    expect(
      systemOf('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/138.0 Mobile Safari/537.36'),
    ).toEqual({
      system: 'android',
      form: 'phone',
    });
    expect(systemOf('Mozilla/5.0 (Linux; Android 14; SM-X710) Chrome/125.0 Safari/537.36')).toEqual(
      {
        system: 'android',
        form: 'tablet',
      },
    );
  });

  it('names a Chromebook as one, not as the Linux it also says it is', () => {
    expect(systemOf('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/138.0 Safari/537.36')).toEqual(
      {
        system: 'chromeos',
        form: 'computer',
      },
    );
  });

  it('names a computer by its system', () => {
    expect(systemOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')?.system).toBe('macos');
    expect(systemOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')?.system).toBe('windows');
    expect(systemOf('Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Firefox/140.0')?.system).toBe(
      'linux',
    );
  });

  it('names nothing where the user agent names no system', () => {
    expect(systemOf('')).toBeNull();
    expect(systemOf('curl/8.7.1')).toBeNull();
  });
});
