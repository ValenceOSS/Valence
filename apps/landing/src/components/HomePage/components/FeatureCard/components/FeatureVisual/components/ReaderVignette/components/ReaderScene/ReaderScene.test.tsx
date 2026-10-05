import { render, screen } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { ReaderScene } from './ReaderScene';

const atFrame = (frame: number) =>
  render(
    <Thumbnail
      component={ReaderScene}
      durationInFrames={240}
      fps={30}
      compositionWidth={423}
      compositionHeight={264}
      frameToDisplay={frame}
    />,
  );

describe('ReaderScene', () => {
  it('opens on a spread of the book, with its chapter and how far through', () => {
    atFrame(0);

    expect(screen.getByText('A Christmas Carol — Stave I: Marley’s Ghost')).toBeInTheDocument();
    expect(screen.getByText('“And a happy new year!”')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('turns to the next spread when the arrow is pressed', () => {
    atFrame(90);

    expect(screen.getByText('“Nothing!” Scrooge replied.')).toBeInTheDocument();
    expect(screen.getByText('9%')).toBeInTheDocument();
  });

  it('is back on the first spread by the end, where it began', () => {
    atFrame(239);

    expect(screen.getByText('“And a happy new year!”')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderScene.displayName).toBe('ReaderScene');
  });
});
