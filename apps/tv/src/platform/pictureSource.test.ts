import { pictureSource } from '@ValenceTv/platform/pictureSource';

describe('pictureSource', () => {
  it('carries the headers that sign the request', () => {
    expect(pictureSource('https://valence.local/a.png', { authorization: 'Bearer x' })).toEqual({
      uri: 'https://valence.local/a.png',
      headers: { authorization: 'Bearer x' },
    });
  });

  it('carries no headers at all where there are none to send', () => {
    expect(pictureSource('https://valence.local/a.png', {})).toEqual({
      uri: 'https://valence.local/a.png',
    });
  });
});
