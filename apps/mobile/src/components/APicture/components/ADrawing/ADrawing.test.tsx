import { render, waitFor } from '@testing-library/react-native';
import { DRAWINGS } from '@ValenceMobile/components/APicture/components/ADrawing/DRAWINGS';
import { ADrawing } from './ADrawing';

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>';

const answering = (ok: boolean) =>
  jest
    .spyOn(global, 'fetch')
    .mockResolvedValue(
      new Response(ok ? SVG : 'gone', { status: ok ? 200 : 404, statusText: ok ? 'OK' : 'Gone' }),
    );

afterEach(() => {
  jest.restoreAllMocks();
  DRAWINGS.clear();
});

describe('ADrawing', () => {
  it('reads the drawing, says so, and keeps it for next time', async () => {
    answering(true);
    const onLoad = jest.fn();

    await render(
      <ADrawing uri="http://one.local/face.svg" onMissing={jest.fn()} onLoad={onLoad} />,
    );

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
    expect(DRAWINGS.get('http://one.local/face.svg')).toBe(SVG);
  });

  it('draws a kept drawing at once without asking for it again', async () => {
    DRAWINGS.set('http://one.local/kept.svg', SVG);
    const asked = answering(true);
    const onLoad = jest.fn();

    await render(
      <ADrawing uri="http://one.local/kept.svg" onMissing={jest.fn()} onLoad={onLoad} />,
    );

    expect(onLoad).toHaveBeenCalled();
    expect(asked).not.toHaveBeenCalled();
  });

  it('says so where the drawing cannot be had', async () => {
    answering(false);
    const onMissing = jest.fn();

    await render(<ADrawing uri="http://one.local/gone.svg" onMissing={onMissing} />);

    await waitFor(() => {
      expect(onMissing).toHaveBeenCalled();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ADrawing.displayName).toBe('ADrawing');
  });
});
