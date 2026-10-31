import { render, waitFor } from '@testing-library/react';
import { MoodBackdrop } from '@ValenceTv/components/MoodBackdrop/MoodBackdrop';
import { readPictureTint } from '@ValenceTv/platform/readPictureTint';

jest.mock('@ValenceTv/platform/readPictureTint', () => ({ readPictureTint: jest.fn() }));

const groundOf = (drawn: ReturnType<typeof render>) =>
  drawn.container.firstElementChild === null
    ? null
    : getComputedStyle(drawn.container.firstElementChild).backgroundColor;

beforeEach(() => {
  jest.mocked(readPictureTint).mockReset().mockResolvedValue('rgb(20, 40, 60)');
});

describe('MoodBackdrop in a browser', () => {
  it('draws no picture, only a colour taken from it once the remote settles', async () => {
    const drawn = render(<MoodBackdrop path="/api/media/a/image/backdrop" />);

    expect(drawn.container.querySelectorAll('img')).toHaveLength(0);
    expect(readPictureTint).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(groundOf(drawn)).toBe('rgb(20, 40, 60)');
    });
    expect(readPictureTint).toHaveBeenCalledWith('/api/media/a/image/backdrop');
  });

  it('reads only the picture the remote settles on', async () => {
    const drawn = render(<MoodBackdrop path="/api/media/a/image/backdrop" />);

    drawn.rerender(<MoodBackdrop path="/api/media/b/image/backdrop" />);
    await waitFor(() => {
      expect(readPictureTint).toHaveBeenCalled();
    });

    expect(readPictureTint).toHaveBeenCalledTimes(1);
    expect(readPictureTint).toHaveBeenCalledWith('/api/media/b/image/backdrop');
  });

  it('draws the plain canvas where nothing is featured, or its colour cannot be read', async () => {
    jest.mocked(readPictureTint).mockResolvedValue(null);
    const drawn = render(<MoodBackdrop path="/api/media/a/image/backdrop" />);
    const plain = groundOf(render(<MoodBackdrop path={null} />));

    await waitFor(() => {
      expect(readPictureTint).toHaveBeenCalled();
    });

    expect(groundOf(drawn)).toBe(plain);
    expect(plain).not.toBe('rgb(20, 40, 60)');
  });
});
