import { videoFill } from '@ValenceTv/theme/videoFill';

describe('videoFill', () => {
  it('states its size as well as its edges, since a browser’s video keeps its own height otherwise', () => {
    expect(videoFill).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    });
  });
});
