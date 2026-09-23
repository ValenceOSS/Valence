import { readOpeningLink } from '@ValenceTv/navigation/readOpeningLink';

describe('readOpeningLink', () => {
  it('reads a film to open', () => {
    expect(readOpeningLink('valence://open/film/abc')).toEqual({ kind: 'film', mediaId: 'abc' });
  });

  it('reads a programme to open, decoding its name', () => {
    expect(readOpeningLink('valence://open/show/the%20bear?from=shelf')).toEqual({
      kind: 'show',
      mediaId: 'the bear',
    });
  });

  it('asks for nothing where there is no link', () => {
    expect(readOpeningLink(null)).toBeNull();
  });

  it('asks for nothing where the link names something Valence does not open', () => {
    expect(readOpeningLink('valence://open/album/abc')).toBeNull();
    expect(readOpeningLink('https://example.com/open/film/abc')).toBeNull();
    expect(readOpeningLink('valence://open/film/')).toBeNull();
  });
});
