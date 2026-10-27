import { describe, expect, it } from 'vitest';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import { pickStreamOffer } from './pickStreamOffer';
import type { Screen } from './pickStreamOffer';

const A_4K_SCREEN: Screen = {
  maxHeight: 2160,
  showsHdr: true,
  playsCodec: () => true,
  runtimeMinutes: 120,
};

const idOf = (picked: { id: string } | null) => picked?.id ?? null;

describe('pickStreamOffer', () => {
  it('chooses only a stream ready to start, and never one filmed in a cinema', () => {
    expect(
      idOf(
        pickStreamOffer(
          [
            aStreamOffer({ id: 'later', isReady: false }),
            aStreamOffer({ id: 'cam', source: 'cam', resolution: '2160p' }),
            aStreamOffer({ id: 'ready' }),
          ],
          A_4K_SCREEN,
        ),
      ),
    ).toBe('ready');
    expect(pickStreamOffer([aStreamOffer({ isReady: false })], A_4K_SCREEN)).toBeNull();
  });

  it('chooses the sharpest picture the screen shows, and no sharper', () => {
    const offers = [
      aStreamOffer({ id: '1080', resolution: '1080p' }),
      aStreamOffer({ id: '4k', resolution: '2160p', sizeBytes: 30_000_000_000 }),
    ];

    expect(idOf(pickStreamOffer(offers, A_4K_SCREEN))).toBe('4k');
    expect(idOf(pickStreamOffer(offers, { ...A_4K_SCREEN, maxHeight: 1080 }))).toBe('1080');
  });

  it('chooses what plays without converting: a codec the device decodes, HDR only where shown', () => {
    const offers = [
      aStreamOffer({
        id: 'hevc-hdr',
        resolution: '2160p',
        codec: 'h265',
        hdr: ['hdr10'],
        sizeBytes: 30e9,
      }),
      aStreamOffer({ id: 'avc', resolution: '1080p', codec: 'h264' }),
    ];

    expect(idOf(pickStreamOffer(offers, { ...A_4K_SCREEN, showsHdr: false }))).toBe('avc');
    expect(
      idOf(pickStreamOffer(offers, { ...A_4K_SCREEN, playsCodec: (codec) => codec === 'h264' })),
    ).toBe('avc');
    expect(idOf(pickStreamOffer(offers, A_4K_SCREEN))).toBe('hevc-hdr');
  });

  it('prefers a disc release, then a usual size, then the best seeded', () => {
    expect(
      idOf(
        pickStreamOffer(
          [
            aStreamOffer({ id: 'web', source: 'webdl' }),
            aStreamOffer({ id: 'disc', source: 'bluray' }),
          ],
          A_4K_SCREEN,
        ),
      ),
    ).toBe('disc');
    expect(
      idOf(
        pickStreamOffer(
          [
            aStreamOffer({ id: 'starved', sizeBytes: 1_000_000_000 }),
            aStreamOffer({ id: 'usual', sizeBytes: 9_000_000_000 }),
          ],
          A_4K_SCREEN,
        ),
      ),
    ).toBe('usual');
    expect(
      idOf(
        pickStreamOffer(
          [aStreamOffer({ id: 'few', seeders: 2 }), aStreamOffer({ id: 'many', seeders: 90 })],
          A_4K_SCREEN,
        ),
      ),
    ).toBe('many');
  });
});
