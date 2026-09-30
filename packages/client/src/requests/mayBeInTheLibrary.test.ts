import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { mayBeInTheLibrary } from './mayBeInTheLibrary';

describe('mayBeInTheLibrary', () => {
  it('says no while nothing of it has arrived', () => {
    expect(mayBeInTheLibrary(aMediaRequest({ state: 'downloading' }))).toBe(false);
  });

  it('says yes once it is matched to something in the library, or filed', () => {
    expect(mayBeInTheLibrary(aMediaRequest({ mediaId: 'dune' }))).toBe(true);
    expect(mayBeInTheLibrary(aMediaRequest({ state: 'filed' }))).toBe(true);
    expect(mayBeInTheLibrary(aMediaRequest({ state: 'available' }))).toBe(true);
  });

  it('says yes for a programme still downloading once any episode of it is here', () => {
    expect(
      mayBeInTheLibrary(
        aMediaRequest({
          kind: 'series',
          state: 'downloading',
          items: [aRequestItem({ state: 'downloading' }), aRequestItem({ state: 'available' })],
        }),
      ),
    ).toBe(true);
  });
});
