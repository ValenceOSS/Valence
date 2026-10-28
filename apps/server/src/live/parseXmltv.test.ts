import { describe, expect, it } from 'vitest';
import { parseXmltv } from './parseXmltv';

const WINDOW = { from: new Date('2026-10-28T00:00:00Z'), until: new Date('2026-10-29T00:00:00Z') };

const programme = (start: string, stop: string, title: string) =>
  `<programme start="${start} +0000" stop="${stop} +0000" channel="news.uk"><title>${title}</title><desc>About it</desc></programme>`;

describe('parseXmltv', () => {
  it('reads the programmes in the window and the names each channel goes by', async () => {
    const parsed = await parseXmltv(
      `<tv><channel id="news.uk"><display-name>News 24</display-name><display-name>News</display-name></channel>${programme(
        '20261028090000',
        '20261028100000',
        'Headlines',
      )}${programme('20261101090000', '20261101100000', 'Next week')}</tv>`,
      WINDOW,
    );

    expect(parsed.names.get('news.uk')).toEqual(['News 24', 'News']);
    expect(parsed.programmes).toEqual([
      expect.objectContaining({ guideId: 'news.uk', title: 'Headlines', description: 'About it' }),
    ]);
  });

  it('lets the server answer while it reads a large guide', async () => {
    const guide = `<tv>${Array.from({ length: 60_000 }, (_, at) =>
      programme('20261028090000', '20261028100000', `Programme ${at.toString()}`),
    ).join('')}</tv>`;
    let beats = 0;
    let isReading = true;
    const beat = () => {
      beats += 1;

      if (isReading) {
        setImmediate(beat);
      }
    };

    setImmediate(beat);

    const parsed = await parseXmltv(guide, WINDOW);

    isReading = false;

    expect(parsed.programmes).toHaveLength(60_000);
    expect(beats).toBeGreaterThan(1);
  });
});
