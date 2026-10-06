import { theTvsStore } from '@ValenceTv/platform/theTvsStore';

describe('theTvsStore in a browser', () => {
  it('keeps what it is given in the browser’s own storage', () => {
    theTvsStore().write('valence.server.address', 'http://valence.local:8420');

    expect(window.localStorage.getItem('valence.server.address')).toBe('http://valence.local:8420');
    expect(theTvsStore().read('valence.server.address')).toBe('http://valence.local:8420');
  });
});
