import { describe, expect, it } from 'vitest';
import { detectArm } from './detectArm';

const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const answering = (architecture: string) => ({
  getHighEntropyValues: () => Promise.resolve({ architecture }),
});

describe('detectArm', () => {
  it('asks the browser, since Windows on Arm calls itself x64 in its user agent', async () => {
    await expect(detectArm({ userAgent: WINDOWS, userAgentData: answering('arm') })).resolves.toBe(
      true,
    );
    await expect(detectArm({ userAgent: WINDOWS, userAgentData: answering('x86') })).resolves.toBe(
      false,
    );
  });

  it('reads an ARM64 Linux user agent where the browser has no answer', async () => {
    await expect(
      detectArm({ userAgent: 'Mozilla/5.0 (X11; Linux aarch64; rv:140.0) Gecko/20100101' }),
    ).resolves.toBe(true);
    await expect(
      detectArm({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' }),
    ).resolves.toBe(false);
  });

  it('falls back to the user agent where the browser answers with nothing', async () => {
    await expect(
      detectArm({
        userAgent: 'Mozilla/5.0 (X11; Linux aarch64)',
        userAgentData: { getHighEntropyValues: () => Promise.resolve({}) },
      }),
    ).resolves.toBe(true);
  });

  it('says no where the browser refuses to answer', async () => {
    await expect(
      detectArm({
        userAgent: WINDOWS,
        userAgentData: {
          getHighEntropyValues: () => Promise.reject(new Error('NotAllowedError')),
        },
      }),
    ).resolves.toBe(false);
  });
});
