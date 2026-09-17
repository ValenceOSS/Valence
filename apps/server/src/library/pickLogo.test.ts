import { describe, expect, it } from 'vitest';
import { pickLogo, rankLanguage } from './pickLogo';
import type { LogoCandidate } from './pickLogo';

const logo = (overrides: Partial<LogoCandidate> = {}): LogoCandidate => ({
  filePath: '/logo.png',
  language: 'en',
  width: 1000,
  voteAverage: 0,
  voteCount: 0,
  ...overrides,
});

describe('rankLanguage', () => {
  it('puts the viewer’s own language first', () => {
    expect(rankLanguage('en', 'en', 'ja')).toBe(0);
  });

  it('puts lettering that carries no words second, since anybody can read it', () => {
    expect(rankLanguage(null, 'en', 'ja')).toBeGreaterThan(rankLanguage('en', 'en', 'ja'));
    expect(rankLanguage(null, 'en', 'ja')).toBeLessThan(rankLanguage('ja', 'en', 'ja'));
  });

  it('prefers the tongue a programme was made in over some third language', () => {
    expect(rankLanguage('ja', 'en', 'ja')).toBeLessThan(rankLanguage('uk', 'en', 'ja'));
  });
});

describe('pickLogo', () => {
  it('has nothing to offer when a catalogue holds none', () => {
    expect(pickLogo([])).toBeNull();
  });

  it('takes the readable one over the better rated one', () => {
    const chosen = pickLogo(
      [
        logo({ filePath: '/ja.png', language: 'ja', width: 1232, voteAverage: 3.3 }),
        logo({ filePath: '/en.png', language: 'en', width: 1097, voteAverage: 0 }),
      ],
      { originalLanguage: 'ja' },
    );

    expect(chosen?.filePath).toBe('/en.png');
  });

  it('takes the larger of two nobody has said anything about', () => {
    const chosen = pickLogo([
      logo({ filePath: '/small.png', width: 600 }),
      logo({ filePath: '/big.png', width: 1097 }),
    ]);

    expect(chosen?.filePath).toBe('/big.png');
  });

  it('takes the one people liked over the one that is merely bigger', () => {
    const chosen = pickLogo([
      logo({ filePath: '/white-silhouette.png', width: 3840, voteAverage: 0, voteCount: 0 }),
      logo({ filePath: '/as-designed.png', width: 1000, voteAverage: 5.3, voteCount: 12 }),
    ]);

    expect(chosen?.filePath).toBe('/as-designed.png');
  });

  it('lets the number of voters settle two rated the same to a tenth', () => {
    const chosen = pickLogo([
      logo({ filePath: '/barely-voted.png', voteAverage: 5.308, voteCount: 2 }),
      logo({ filePath: '/well-voted.png', voteAverage: 5.312, voteCount: 40 }),
    ]);

    expect(chosen?.filePath).toBe('/well-voted.png');
  });

  it('still lets a real difference in rating decide', () => {
    const chosen = pickLogo([
      logo({ filePath: '/poor.png', voteAverage: 5.2, voteCount: 90 }),
      logo({ filePath: '/good.png', voteAverage: 8.4, voteCount: 3 }),
    ]);

    expect(chosen?.filePath).toBe('/good.png');
  });

  it('falls back to the programme’s own tongue rather than to nothing', () => {
    const chosen = pickLogo(
      [
        logo({ filePath: '/uk.png', language: 'uk', width: 2000 }),
        logo({ filePath: '/ja.png', language: 'ja', width: 900 }),
      ],
      { originalLanguage: 'ja' },
    );

    expect(chosen?.filePath).toBe('/ja.png');
  });

  it('uses the catalogue’s rating ahead of anything about the file itself', () => {
    const chosen = pickLogo([
      logo({ filePath: '/liked.png', width: 1000, voteAverage: 8 }),
      logo({ filePath: '/unrated.png', width: 1000, voteAverage: 0 }),
    ]);

    expect(chosen?.filePath).toBe('/liked.png');
  });

  it('answers with something rather than nothing when none of it is readable', () => {
    const chosen = pickLogo([logo({ filePath: '/uk.png', language: 'uk' })]);

    expect(chosen?.filePath).toBe('/uk.png');
  });
});
