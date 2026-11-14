import { describe, expect, it } from 'vitest';
import { parseAdvancedSubStation } from './parseAdvancedSubStation';

const SCRIPT = [
  '[Script Info]',
  'Title: A film',
  'PlayResX: 1920',
  'PlayResY: 1080',
  '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, Bold, Italic, Underline, StrikeOut, Alignment, MarginL, MarginR, MarginV',
  'Style: Default,Arial,48,&H00FFFFFF,0,0,0,0,2,96,96,54',
  'Style: Sign,Impact,72,&H000000FF,-1,0,0,0,7,0,0,0',
  '',
  '[Events]',
  'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  "Dialogue: 0,0:01:22.30,0:01:25.10,Default,,0,0,0,,I'll be back by six.",
  'Dialogue: 0,0:01:30.00,0:01:34.00,Sign,,0,0,0,,{\\pos(1440,216)}CLOSED',
].join('\n');

const parsed = parseAdvancedSubStation(SCRIPT);

describe('reading an Advanced SubStation script', () => {
  it('reads the lines and when they are said', () => {
    expect(parsed.cues).toHaveLength(2);
    expect(parsed.cues[0]?.from).toBeCloseTo(82.3, 2);
    expect(parsed.cues[0]?.to).toBeCloseTo(85.1, 2);
  });

  it('keeps the words', () => {
    expect(parsed.cues[0]?.spans.map((span) => span.text).join('')).toBe("I'll be back by six.");
    expect(parsed.cues[1]?.spans.map((span) => span.text).join('')).toBe('CLOSED');
  });

  it('dresses a line in the style it named, rather than ignoring the styles section', () => {
    expect(parsed.cues[0]?.spans[0]).toMatchObject({
      fontFamily: 'Arial',
      fontHeight: 48 / 1080,
      colour: '#ffffff',
      isBold: false,
    });

    expect(parsed.cues[1]?.spans[0]).toMatchObject({
      fontFamily: 'Impact',
      fontHeight: 72 / 1080,
      colour: '#ff0000',
      isBold: true,
    });
  });

  it('puts a positioned line where the script put it, as a fraction of the picture', () => {
    expect(parsed.cues[1]?.position?.x).toBeCloseTo(0.75, 3);
    expect(parsed.cues[1]?.position?.y).toBeCloseTo(0.2, 3);
  });

  it('leaves dialogue unpositioned, for whatever draws it to place', () => {
    expect(parsed.cues[0]?.position).toBeNull();
  });

  it('calls a positioned line a sign and an ordinary one not', () => {
    expect(parsed.cues[0]?.isSign).toBe(false);
    expect(parsed.cues[1]?.isSign).toBe(true);
  });

  it('reads margins as fractions of the picture too', () => {
    expect(parsed.cues[0]?.margins.left).toBeCloseTo(0.05, 3);
    expect(parsed.cues[0]?.margins.vertical).toBeCloseTo(0.05, 3);
  });
});

describe('what a script says about where a line sits', () => {
  const withEvents = (...events: string[]) =>
    parseAdvancedSubStation(
      [
        '[V4+ Styles]',
        'Format: Name, Alignment',
        'Style: Default,2',
        'Style: Top,8',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        ...events,
      ].join('\n'),
    );

  it('reads a line aligned to the top as one to read in the top row, rather than a sign', () => {
    const { cues } = withEvents('Dialogue: 0,0:00:01.00,0:00:02.00,Top,,Said up here');

    expect(cues[0]?.alignment).toBe(8);
    expect(cues[0]?.isSign).toBe(false);
  });

  it('treats a line at the bottom centre as dialogue, which is where dialogue goes', () => {
    const { cues } = withEvents('Dialogue: 0,0:00:01.00,0:00:02.00,Default,,Spoken');

    expect(cues[0]?.alignment).toBe(2);
    expect(cues[0]?.isSign).toBe(false);
  });

  it('lets a line override the alignment its style asked for', () => {
    const { cues } = withEvents('Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\an9}Up there');

    expect(cues[0]?.alignment).toBe(9);
    expect(cues[0]?.isSign).toBe(false);
  });
});

describe('the lettering changing partway through a line', () => {
  const spansOf = (text: string) =>
    parseAdvancedSubStation(
      [
        '[V4+ Styles]',
        'Format: Name, Fontname, Italic',
        'Style: Default,Arial,0',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        `Dialogue: 0,0:00:01.00,0:00:02.00,Default,,${text}`,
      ].join('\n'),
    ).cues[0]?.spans ?? [];

  it('splits a line where an override changes it, rather than dressing all of it the same', () => {
    const spans = spansOf('plain {\\i1}italic{\\i0} plain again');

    expect(spans.map((span) => [span.text, span.isItalic])).toEqual([
      ['plain ', false],
      ['italic', true],
      [' plain again', false],
    ]);
  });

  it('starts over from the line’s own style when told to', () => {
    const spans = spansOf('{\\i1}italic{\\r}back to normal');

    expect(spans[1]?.isItalic).toBe(false);
  });

  it('keeps a line that is nothing but an override block from becoming an empty line', () => {
    expect(spansOf('{\\i1}')).toHaveLength(0);
  });

  it('turns the script’s own line breaks into real ones', () => {
    expect(spansOf('one\\Ntwo')[0]?.text).toBe('one\ntwo');
  });

  it('leaves the words when it cannot draw what was asked for', () => {
    expect(spansOf('{\\t(0,500,\\frz360)\\blur2}spinning')[0]?.text).toBe('spinning');
  });

  it('leaves out a vector drawing, which is a shape written as coordinates', () => {
    const spans = spansOf('{\\p1}m 0 0 l 100 0 100 100 0 100{\\p0}A sign beside it');

    expect(spans.map((span) => span.text)).toEqual(['A sign beside it']);
  });

  it('leaves out a run the script made invisible', () => {
    const spans = spansOf('{\\alpha&HFF&}ghost {\\alpha&H00&}visible');

    expect(spans.map((span) => span.text)).toEqual(['visible']);
  });

  it('shows a line that fades out, rather than taking where it ends for where it starts', () => {
    expect(spansOf('{\\t(0,500,\\alpha&HFF&)}going')[0]?.text).toBe('going');
  });

  it('shows a line that starts invisible and fades in', () => {
    expect(spansOf('{\\alpha&HFF&\\t(0,300,\\alpha&H00&)}arriving')[0]).toMatchObject({
      text: 'arriving',
      opacity: 1,
    });
    expect(spansOf('{\\1a&HFF&\\t(0,100,\\1a&H00&)}Ko')[0]?.text).toBe('Ko');
  });

  it('shows a line whose colour tag carries a transparency, as libass does', () => {
    expect(spansOf('{\\c&HFF0000FF&}still here')[0]?.text).toBe('still here');
  });
});

describe('lines with nothing to read in them', () => {
  const cuesOf = (...events: string[]) =>
    parseAdvancedSubStation(
      ['[Events]', 'Format: Layer, Start, End, Style, Name, Text', ...events].join('\n'),
    ).cues;

  it('drops a line that is only a drawing', () => {
    expect(
      cuesOf('Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\p1}m 0 0 l 1920 0 1920 1080{\\p0}'),
    ).toEqual([]);
  });

  it('drops a line that is only invisible', () => {
    expect(cuesOf('Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\alpha&HFF&}hidden')).toEqual([]);
  });
});

describe('styles a line asks for by name', () => {
  const script = (...events: string[]) =>
    parseAdvancedSubStation(
      [
        '[V4+ Styles]',
        'Format: Name, Fontname, Italic, Alignment',
        'Style: Default,Arial,0,2',
        'Style: Thoughts,Georgia,1,2',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        ...events,
      ].join('\n'),
    ).cues;

  it('starts over from the style a reset names', () => {
    const spans =
      script('Dialogue: 0,0:00:01.00,0:00:02.00,Default,,said {\\rThoughts}thought')[0]?.spans ??
      [];

    expect(spans.map((span) => [span.text, span.fontFamily, span.isItalic])).toEqual([
      ['said ', 'Arial', false],
      ['thought', 'Georgia', true],
    ]);
  });

  it('dresses a line naming a style the script never defined in its Default style', () => {
    const spans = script('Dialogue: 0,0:00:01.00,0:00:02.00,Nowhere,,Still said')[0]?.spans ?? [];

    expect(spans[0]?.fontFamily).toBe('Arial');
  });
});

describe('scripts that are not the tidy case', () => {
  it('falls back to the format’s own resolution where the script declares none', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\pos(192,144)}Middle',
      ].join('\n'),
    );

    expect(cues[0]?.position?.x).toBeCloseTo(0.5, 3);
    expect(cues[0]?.position?.y).toBeCloseTo(0.5, 3);
  });

  it('reads the columns from the Format line rather than from where they usually are', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Start, End, Text, Style',
        'Dialogue: 0:00:01.00,0:00:02.00,Backwards,Default',
      ].join('\n'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('Backwards');
  });

  it('keeps the commas in a line that contains them, the text being the last column', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,Yes, and then, no',
      ].join('\n'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('Yes, and then, no');
  });

  it('numbers the older section’s alignments the older way', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[V4 Styles]',
        'Format: Name, Alignment',
        'Style: Default,6',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,Up top',
      ].join('\n'),
    );

    expect(cues[0]?.alignment).toBe(8);
  });

  it('drops a line whose timestamps make no sense rather than showing it at zero', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,whenever,0:00:02.00,Default,,Nonsense',
      ].join('\n'),
    );

    expect(cues).toHaveLength(0);
  });

  it('reads a line naming a style the script never defined, rather than dropping it', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Missing,,Still said',
      ].join('\n'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('Still said');
    expect(cues[0]?.isSign).toBe(false);
  });

  it('reads the usual columns where the events section names none', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,No format line above me',
      ].join('\n'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('No format line above me');
  });

  it('reads the usual columns where the Format line leaves out the text', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,Line one',
      ].join('\n'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('Line one');
  });

  it('reads lines written with a space before them or before a colon', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format : Layer, Start, End, Style, Name, Text',
        '  Dialogue: 0,0:00:01.00,0:00:02.00,Default,,Indented',
      ].join('\n'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('Indented');
  });

  it('reads the older alignment tag the older way, whichever kind of script carries it', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[V4+ Styles]',
        'Format: Name, Alignment',
        'Style: Default,2',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\a6}Up top',
      ].join('\n'),
    );

    expect(cues[0]?.alignment).toBe(8);
  });

  it('puts a moving line where it comes to rest, as a sign', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\move(96,72,288,216)}Moving',
      ].join('\n'),
    );

    expect(cues[0]?.position).toEqual({ x: 0.75, y: 0.75 });
    expect(cues[0]?.isSign).toBe(true);
  });

  it('puts a line that slides in from off the picture where it comes to rest', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\move(-100,144,192,144)}Sliding in',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\move(192,144,500,144)}Sliding out',
      ].join('\n'),
    );

    expect(cues.map((cue) => cue.position?.x)).toEqual([0.5, 0.5]);
  });

  it('reads a script saved with nothing but carriage returns between its lines', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,Old line endings',
      ].join('\r'),
    );

    expect(cues[0]?.spans[0]?.text).toBe('Old line endings');
  });

  it('drops a line with nothing in it but spaces and breaks', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,   ',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\an8}\\h\\N',
      ].join('\n'),
    );

    expect(cues).toEqual([]);
  });

  it('matches a style named with a leading asterisk to lines that name it without one', () => {
    const { cues } = parseAdvancedSubStation(
      [
        '[V4+ Styles]',
        'Format: Name, Alignment',
        'Style: *Top,8',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, Text',
        'Dialogue: 0,0:00:01.00,0:00:02.00,Top,,Up there',
      ].join('\n'),
    );

    expect(cues[0]?.alignment).toBe(8);
  });

  it('works out the side a script did not declare, as libass does', () => {
    const lineAt = (declared: string) =>
      parseAdvancedSubStation(
        [
          '[Script Info]',
          declared,
          '[Events]',
          'Format: Layer, Start, End, Style, Name, Text',
          'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,{\\pos(960,540)}Sign',
        ].join('\n'),
      ).cues[0]?.position;

    expect(lineAt('PlayResY: 1080')?.x).toBeCloseTo(960 / 1440, 5);
    expect(lineAt('PlayResX: 1920')?.y).toBeCloseTo(540 / 1440, 5);
    expect(lineAt('PlayResX: 1280')?.y).toBeCloseTo(540 / 1024, 5);
  });

  it('finds nothing in a file that is not a script, without failing', () => {
    expect(parseAdvancedSubStation('this is not a subtitle file').cues).toEqual([]);
    expect(parseAdvancedSubStation('').cues).toEqual([]);
  });
});
