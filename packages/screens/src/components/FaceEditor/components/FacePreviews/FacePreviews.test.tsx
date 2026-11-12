import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FacePreviews } from './FacePreviews';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: () => 'blob:chosen',
});
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });

const PHOTO = { kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false } as const;

describe('FacePreviews', () => {
  it('lets a photograph be dragged into place in the large face', () => {
    render(
      <FacePreviews
        name="Dan"
        colour="#3a8ee8"
        avatar={PHOTO}
        source="/api/profiles/p1/avatar"
        pending={new File(['x'], 'face.png', { type: 'image/png' })}
        onFrame={vi.fn()}
      />,
    );

    expect(screen.getByRole('group', { name: /Where the picture sits/u })).toBeInTheDocument();
  });

  it('frames a saved photograph from the whole of it', () => {
    const { container } = render(
      <FacePreviews
        name="Dan"
        colour="#3a8ee8"
        avatar={PHOTO}
        source="/api/profiles/p1/avatar"
        pending={null}
        onFrame={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('group', { name: /Where the picture sits/u }).querySelector('img'),
    ).toHaveAttribute('src', '/api/profiles/p1/avatar');
    expect(container.querySelectorAll('img').length).toBeGreaterThan(1);
  });

  it('draws a face that is not a photograph, or one that cannot be moved, as it is', () => {
    render(
      <FacePreviews
        name="Dan"
        colour="#3a8ee8"
        avatar={{ kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED }}
        source="/api/profiles/p1/avatar"
        pending={null}
        onFrame={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('group', { name: /Where the picture sits/u }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FacePreviews.displayName).toBe('FacePreviews');
  });
});
