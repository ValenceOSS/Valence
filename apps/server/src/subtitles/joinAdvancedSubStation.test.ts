import { describe, expect, it } from 'vitest';
import { joinAdvancedSubStation } from './joinAdvancedSubStation';

const script = (events: string[], after = '') =>
  [
    '[Script Info]',
    'PlayResX: 1920',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize',
    'Style: Default,Arial,48',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Text',
    ...events,
    '',
    after,
  ].join('\n');

describe('joinAdvancedSubStation', () => {
  it('adds each later part’s events, moved on by where it starts, to the first part’s events', () => {
    const joined = joinAdvancedSubStation([
      { content: script(['Dialogue: 0,0:00:01.00,0:00:02.00,Default,First']), offsetSeconds: 0 },
      {
        content: script(['Dialogue: 0,0:00:03.50,0:00:04.00,Default,Second, with a comma']),
        offsetSeconds: 3600,
      },
    ]);

    expect(joined.split('\n').filter((line) => line.startsWith('Dialogue:'))).toEqual([
      'Dialogue: 0,0:00:01.00,0:00:02.00,Default,First',
      'Dialogue: 0,1:00:03.50,1:00:04.00,Default,Second, with a comma',
    ]);
    expect(joined.match(/\[Script Info\]/g)).toHaveLength(1);
  });

  it('keeps a section after the events where it was, after every event', () => {
    const joined = joinAdvancedSubStation([
      {
        content: script(['Dialogue: 0,0:00:01.00,0:00:02.00,Default,First'], '[Fonts]'),
        offsetSeconds: 0,
      },
      { content: script(['Comment: 0,0:00:01.00,0:00:02.00,Default,Note']), offsetSeconds: 90 },
    ]);
    const lines = joined.split('\n');

    expect(lines.indexOf('Comment: 0,0:01:31.00,0:01:32.00,Default,Note')).toBeLessThan(
      lines.indexOf('[Fonts]'),
    );
  });

  it('reads the start and end by the columns the script names', () => {
    const joined = joinAdvancedSubStation([
      {
        content: [
          '[Events]',
          'Format: Start, End, Layer, Style, Text',
          'Dialogue: 0:00:01.00,0:00:02.00,0,Default,Moved',
        ].join('\n'),
        offsetSeconds: 10,
      },
    ]);

    expect(joined).toContain('Dialogue: 0:00:11.00,0:00:12.00,0,Default,Moved');
  });
});
