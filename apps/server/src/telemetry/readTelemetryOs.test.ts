import { describe, expect, it } from 'vitest';
import { readTelemetryOs } from './readTelemetryOs';

describe('readTelemetryOs', () => {
  it('passes on a system the report knows', () => {
    expect(
      readTelemetryOs({ platform: 'linux', release: '6.8.0-45-generic', arch: 'x64' }),
    ).toEqual({ platform: 'linux', release: '6.8.0-45-generic', arch: 'x64' });
  });

  it('calls a platform or architecture the report does not know other', () => {
    expect(readTelemetryOs({ platform: 'sunos', release: '5.11', arch: 'riscv64' })).toEqual({
      platform: 'other',
      release: '5.11',
      arch: 'other',
    });
  });

  it('cuts a long release to the length the report allows', () => {
    expect(
      readTelemetryOs({ platform: 'darwin', release: 'x'.repeat(200), arch: 'arm64' }).release,
    ).toHaveLength(80);
  });
});
