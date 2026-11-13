import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FaceStage } from './FaceStage';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 400 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get: () => 200,
});

const FACE = {
  name: 'Dan',
  colour: '#3a8ee8',
  source: '/api/profiles/p1/avatar',
  pending: null,
} as const;

describe('FaceStage', () => {
  it('draws the face itself where no photograph is being placed', () => {
    render(
      <FaceStage
        {...FACE}
        avatar={{ kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED }}
        framing={null}
      />,
    );

    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('lets a photograph be dragged into its circle, the whole of it in view', () => {
    render(
      <FaceStage
        {...FACE}
        avatar={{ kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false }}
        framing={{
          picture: 'blob:chosen',
          frame: { zoom: 1, x: 0, y: 0 },
          tone: { saturate: 0, hueRotate: 0, contrast: 1, brightness: 1, layer: null },
          onFrame: vi.fn(),
        }}
      />,
    );

    const stage = screen.getByRole('group', { name: /Where the picture sits/u });

    expect(stage.querySelectorAll('img')).toHaveLength(2);
    expect(stage.querySelectorAll('img')[1]?.style.filter).toBe('saturate(0)');
    expect(screen.getByText(/Drag the picture to move it/u)).toBeInTheDocument();
    expect(stage.querySelector('img')).toHaveAttribute('src', 'blob:chosen');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FaceStage.displayName).toBe('FaceStage');
  });
});
