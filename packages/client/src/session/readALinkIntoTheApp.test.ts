import { describe, expect, it } from 'vitest';
import { readALinkIntoTheApp } from './readALinkIntoTheApp';

describe('readALinkIntoTheApp', () => {
  it('leaves any other link alone, such as a sign-in coming back from the browser', () => {
    expect(readALinkIntoTheApp('valence://signed-in?code=abc')).toBeNull();
    expect(readALinkIntoTheApp('https://valence.example/device?user_code=ABCD')).toBeNull();
  });

  it('asks nothing of a television link that carries no code', () => {
    expect(readALinkIntoTheApp('valence://device?server=x')).toBeNull();
  });

  it('manages without the server, and without a garbled one', () => {
    expect(readALinkIntoTheApp('valence://device?user_code=ABCD&server=%E0')).toEqual({
      kind: 'device',
      code: 'ABCD',
      server: null,
    });
  });
});
