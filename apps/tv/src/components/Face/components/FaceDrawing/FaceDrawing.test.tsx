import { render, waitFor } from '@testing-library/react-native';
import { DRAWINGS } from '@ValenceClient/profiles/DRAWINGS';
import { FaceDrawing } from './FaceDrawing';

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>';

afterEach(() => {
  jest.restoreAllMocks();
  DRAWINGS.clear();
});

describe('FaceDrawing', () => {
  it('reads the drawing and says so once it has', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(SVG, { status: 200 }));
    const onLoad = jest.fn();

    await render(
      <FaceDrawing uri="https://valence.test/face.svg" onLoad={onLoad} onMissing={jest.fn()} />,
    );

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('says so where the drawing cannot be had', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('gone', { status: 404, statusText: 'Gone' }));
    const onMissing = jest.fn();

    await render(
      <FaceDrawing uri="https://valence.test/gone.svg" onLoad={jest.fn()} onMissing={onMissing} />,
    );

    await waitFor(() => {
      expect(onMissing).toHaveBeenCalled();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FaceDrawing.displayName).toBe('FaceDrawing');
  });
});
