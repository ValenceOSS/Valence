import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FaceCircle } from './FaceCircle';

const createObjectURL = vi.fn().mockReturnValue('blob:chosen');
const revokeObjectURL = vi.fn();

Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

beforeEach(() => {
  createObjectURL.mockClear().mockReturnValue('blob:chosen');
  revokeObjectURL.mockClear();
});

describe('FaceCircle', () => {
  it('draws the letter of a name that has no picture', () => {
    render(
      <FaceCircle name="Marques" colour="#3a8ee8" avatar={{ kind: 'initial' }} source="/nowhere" />,
    );

    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('is a circle unless it is asked to be a tile, and stands off the page only when lifted', () => {
    const face = {
      name: 'Marques',
      colour: '#3a8ee8',
      avatar: { kind: 'initial' },
      source: '/x',
    } as const;
    const { container, rerender } = render(<FaceCircle {...face} />);

    expect(container.firstElementChild).toHaveClass('rounded-full');
    expect(container.firstElementChild).not.toHaveClass('shadow-lg');

    rerender(<FaceCircle {...face} shape="tile" isLifted />);

    expect(container.firstElementChild).toHaveClass('rounded-lg', 'shadow-lg');
  });

  it('loads from wherever it was told to, rather than working an address out', () => {
    const { container } = render(
      <FaceCircle
        name="Marques"
        colour="#3a8ee8"
        avatar={{ kind: 'photo', isVideo: false }}
        source="/api/somewhere/else"
      />,
    );

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/somewhere/else');
  });

  it('draws a moving picture as a video rather than an image', () => {
    const { container } = render(
      <FaceCircle
        name="Marques"
        colour="#3a8ee8"
        avatar={{ kind: 'photo', isVideo: true }}
        source="/api/somewhere/else"
      />,
    );

    expect(container.querySelector('video')).not.toBeNull();
  });

  it('falls back to the letter when the picture cannot be loaded', () => {
    const { container } = render(
      <FaceCircle
        name="Marques"
        colour="#3a8ee8"
        avatar={{ kind: 'photo', isVideo: false }}
        source="/api/gone"
      />,
    );

    const picture = container.querySelector('img');

    if (picture === null) {
      throw new Error('Nothing is drawing a picture.');
    }

    fireEvent.error(picture);

    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('tries again once the address changes, rather than staying broken', () => {
    const { container, rerender } = render(
      <FaceCircle
        name="Marques"
        colour="#3a8ee8"
        avatar={{ kind: 'photo', isVideo: false }}
        source="/api/gone?v=1"
      />,
    );

    const picture = container.querySelector('img');

    if (picture === null) {
      throw new Error('Nothing is drawing a picture.');
    }

    fireEvent.error(picture);

    rerender(
      <FaceCircle
        name="Marques"
        colour="#3a8ee8"
        avatar={{ kind: 'photo', isVideo: false }}
        source="/api/gone?v=2"
      />,
    );

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/gone?v=2');
  });

  it('draws a picture being uploaded before the server has taken it', () => {
    const { container } = render(
      <FaceCircle
        name="Marques"
        colour="#3a8ee8"
        avatar={{ kind: 'initial' }}
        source="/api/gone"
        pending={new File(['bytes'], 'face.png', { type: 'image/png' })}
      />,
    );

    expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:chosen');
  });
});
