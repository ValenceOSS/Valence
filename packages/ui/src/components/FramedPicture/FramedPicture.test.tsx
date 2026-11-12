import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FramedPicture } from './FramedPicture';

const loaded = (picture: HTMLImageElement, width: number, height: number) => {
  Object.defineProperty(picture, 'naturalWidth', { configurable: true, value: width });
  Object.defineProperty(picture, 'naturalHeight', { configurable: true, value: height });
  fireEvent.load(picture);
};

const pictureIn = (container: HTMLElement) => {
  const picture = container.querySelector('img');

  if (picture === null) {
    throw new Error('No picture was drawn.');
  }

  return picture;
};

describe('FramedPicture', () => {
  it('shows the middle of the picture until its size is known', () => {
    const { container } = render(
      <FramedPicture src="/wide.jpg" frame={{ zoom: 2, x: 1, y: 0 }} aspect={1} />,
    );

    expect(pictureIn(container)).toHaveClass('object-cover');
  });

  it('places the part its frame chose in the box, once the picture has loaded', () => {
    const onMeasure = vi.fn();
    const { container } = render(
      <FramedPicture
        src="/wide.jpg"
        frame={{ zoom: 1, x: 1, y: 0 }}
        aspect={1}
        onMeasure={onMeasure}
      />,
    );
    const picture = pictureIn(container);

    loaded(picture, 2000, 1000);

    expect(onMeasure).toHaveBeenCalledWith({ width: 2000, height: 1000 });
    expect(picture.style.width).toBe('200%');
    expect(picture.style.height).toBe('100%');
    expect(picture.style.left).toBe('-100%');
    expect(picture.style.top).toBe('0%');
  });

  it('shows the middle of a picture left alone, whatever its shape', () => {
    const { container } = render(<FramedPicture src="/tall.jpg" frame={null} aspect={1} />);
    const picture = pictureIn(container);

    loaded(picture, 1000, 3000);

    expect(picture.style.top).toBe('-100%');
    expect(picture.style.left).toBe('0%');
  });

  it('says when the picture could not be loaded', () => {
    const onError = vi.fn();
    const { container } = render(
      <FramedPicture src="/gone.jpg" frame={null} aspect={1} onError={onError} />,
    );

    fireEvent.error(pictureIn(container));

    expect(onError).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FramedPicture.displayName).toBe('FramedPicture');
  });
});
