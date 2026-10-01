import { describe, expect, it } from 'vitest';
import { ArrStatusSchema } from './ArrStatusSchema';

describe('ArrStatusSchema', () => {
  it('reads the version from what Sonarr and Prowlarr say of themselves', () => {
    expect(
      ArrStatusSchema.parse({
        appName: 'Sonarr',
        instanceName: 'Sonarr',
        version: '4.0.10.2544',
        buildTime: '2024-10-13T17:11:02Z',
        isDebug: false,
        isProduction: true,
        startupPath: '/app/sonarr/bin',
        appData: '/config',
        osName: 'alpine',
        isDocker: true,
        branch: 'main',
        authentication: 'forms',
        urlBase: '',
      }),
    ).toEqual({ appName: 'Sonarr', instanceName: 'Sonarr', version: '4.0.10.2544' });
    expect(ArrStatusSchema.parse({ appName: 'Prowlarr', version: '1.25.4.4818' }).version).toBe(
      '1.25.4.4818',
    );
  });

  it('refuses an answer with no version', () => {
    expect(ArrStatusSchema.safeParse({ appName: 'Radarr' }).success).toBe(false);
  });
});
