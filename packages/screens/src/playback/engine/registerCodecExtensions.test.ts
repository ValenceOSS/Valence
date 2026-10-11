import { describe, expect, it, vi } from 'vitest';
import { registerCodecExtensions } from '@ValenceScreens/playback/engine/registerCodecExtensions';

const registerAc3Decoder = vi.fn<() => void>();
const registerDtsDecoder = vi.fn<() => void>();
const registerFlacEncoder = vi.fn<() => void>();

vi.mock('@mediabunny/ac3', () => ({ registerAc3Decoder: () => registerAc3Decoder() }));
vi.mock('@mediabunny/dts', () => ({ registerDtsDecoder: () => registerDtsDecoder() }));
vi.mock('@mediabunny/flac-encoder', () => ({ registerFlacEncoder: () => registerFlacEncoder() }));

describe('registerCodecExtensions', () => {
  it('teaches Mediabunny AC-3, DTS and FLAC once, however often it is asked', async () => {
    await registerCodecExtensions();
    await registerCodecExtensions();

    expect(registerAc3Decoder).toHaveBeenCalledTimes(1);
    expect(registerDtsDecoder).toHaveBeenCalledTimes(1);
    expect(registerFlacEncoder).toHaveBeenCalledTimes(1);
  });
});
