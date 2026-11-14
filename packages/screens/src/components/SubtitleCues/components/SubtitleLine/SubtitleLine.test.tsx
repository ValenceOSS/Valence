import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubtitleLine } from './SubtitleLine';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { toCueDeclarations } from '@ValenceScreens/playback/captionStyle';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';

const spanOf = (over: Partial<SubtitleSpan> = {}): SubtitleSpan => ({
  text: '',
  fontFamily: null,
  fontHeight: null,
  colour: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
  ...over,
});

const lineOf = (spans: Partial<SubtitleSpan>[], over: Partial<SubtitleCue> = {}): SubtitleCue => ({
  from: 0,
  to: 10,
  spans: spans.map(spanOf),
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
  ...over,
});

const OUTLINED: CaptionStyle = {
  ...DEFAULT_CAPTION_STYLE,
  edgeStyle: 'outline',
  outlineThickness: 2,
};

describe('SubtitleLine', () => {
  it('draws dialogue in the viewer’s own lettering', () => {
    render(
      <SubtitleLine
        cue={lineOf([{ text: 'Over here.', colour: '#00ff00', isBold: true }])}
        style={{ ...DEFAULT_CAPTION_STYLE, color: '#ffff00', opacity: 1 }}
      />,
    );

    expect(screen.getByText('Over here.')).toHaveStyle({ color: 'rgba(255, 255, 0, 1)' });
  });

  it('draws a sign in the script’s lettering, run by run', () => {
    render(
      <SubtitleLine
        cue={lineOf(
          [
            { text: 'CLOSED ', colour: '#ff0000' },
            { text: 'today', isItalic: true },
          ],
          {
            isSign: true,
          },
        )}
        style={DEFAULT_CAPTION_STYLE}
      />,
    );

    expect(screen.getByText('CLOSED')).toHaveStyle({ color: '#ff0000' });
    expect(screen.getByText('today')).toHaveStyle({ fontStyle: 'italic' });
  });

  it('draws a sign’s edge on its lettering, so the edge grows with the lettering', () => {
    const edge = toCueDeclarations(OUTLINED).textShadow;

    render(
      <SubtitleLine
        cue={lineOf([{ text: 'BIG SIGN', fontHeight: 0.1 }], { isSign: true })}
        style={OUTLINED}
      />,
    );

    const lettering = screen.getByText('BIG SIGN');

    expect(lettering.style.textShadow).toBe(edge);
    expect(lettering.style.fontSize).toBe('10cqh');
    expect(lettering.closest('p')?.style.textShadow).toBe('');
  });

  it('rings a sign’s dark lettering in a light edge, in the viewer’s shape and thickness', () => {
    const edge = toCueDeclarations(OUTLINED).textShadow;

    render(
      <SubtitleLine
        cue={lineOf(
          [
            { text: 'NIGHT ', colour: '#101010' },
            { text: 'DAY', colour: '#ffffff' },
          ],
          { isSign: true },
        )}
        style={OUTLINED}
      />,
    );

    const dark = screen.getByText('NIGHT').style.textShadow;

    expect(dark).toBe(edge.replaceAll('rgba(0, 0, 0,', 'rgba(255, 255, 255,'));
    expect(dark).not.toContain('rgba(0, 0, 0,');
    expect(screen.getByText('DAY').style.textShadow).toBe(edge);
  });

  it('lines a line up on the side its alignment names', () => {
    render(
      <>
        <SubtitleLine
          cue={lineOf([{ text: 'On the left' }], { isSign: true, alignment: 7 })}
          style={DEFAULT_CAPTION_STYLE}
        />
        <SubtitleLine
          cue={lineOf([{ text: 'On the right' }], { isSign: true, alignment: 3 })}
          style={DEFAULT_CAPTION_STYLE}
        />
        <SubtitleLine cue={lineOf([{ text: 'In the middle' }])} style={DEFAULT_CAPTION_STYLE} />
      </>,
    );

    expect(screen.getByText('On the left').closest('p')).toHaveStyle({
      alignSelf: 'flex-start',
      textAlign: 'left',
    });
    expect(screen.getByText('On the right').closest('p')).toHaveStyle({
      alignSelf: 'flex-end',
      textAlign: 'right',
    });
    expect(screen.getByText('In the middle')).toHaveStyle({
      alignSelf: 'center',
      textAlign: 'center',
    });
  });
});
