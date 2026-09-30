import { describe, expect, it } from 'vitest';
import { sayParts } from './sayParts';

describe('sayParts', () => {
  it('puts each filling where its gap falls, between the words', () => {
    const link = { kind: 'link' };

    expect(sayParts('requests.downloads.clientSaid', { name: link, said: 'nothing' })).toEqual([
      link,
      ' said: ',
      'nothing',
    ]);
  });

  it('leaves a gap with no filling as written', () => {
    expect(sayParts('requests.downloads.clientSaid', {})).toEqual(['{name}', ' said: ', '{said}']);
  });
});
