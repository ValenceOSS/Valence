import { describe, expect, it } from 'vitest';
import { withOfferedProtocol } from './withOfferedProtocol';

const OFFERED = [
  {
    pluginId: 'example-files',
    pluginName: 'Example files',
    clientId: 'files',
    title: 'Example files',
    protocol: 'usenet' as const,
  },
];

describe('withOfferedProtocol', () => {
  it('takes the protocol from what the plugin declared', () => {
    expect(
      withOfferedProtocol(
        { name: 'x', plugin: { id: 'example-files', clientId: 'files', protocol: 'torrent' } },
        OFFERED,
      ),
    ).toEqual({
      name: 'x',
      plugin: { id: 'example-files', clientId: 'files', protocol: 'usenet' },
    });
  });

  it('leaves a client that names no plugin alone', () => {
    const builtIn = { name: 'x', plugin: null };
    const unnamed: { name: string; plugin?: undefined } = { name: 'x' };

    expect(withOfferedProtocol(builtIn, OFFERED)).toBe(builtIn);
    expect(withOfferedProtocol(unnamed, OFFERED)).toBe(unnamed);
  });

  it('refuses a plugin or client nobody offers', () => {
    expect(
      withOfferedProtocol(
        { plugin: { id: 'example-files', clientId: 'other', protocol: 'torrent' } },
        OFFERED,
      ),
    ).toBeNull();
  });
});
