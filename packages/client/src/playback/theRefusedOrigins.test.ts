import { afterEach, describe, expect, it } from 'vitest';
import { theRefusedOrigins } from './theRefusedOrigins';

describe('theRefusedOrigins', () => {
  afterEach(() => {
    theRefusedOrigins().forget();
  });

  it('keeps what was refused for as long as the page is open', () => {
    theRefusedOrigins().add('https://films.example');

    expect(theRefusedOrigins().has('https://films.example')).toBe(true);
    expect(theRefusedOrigins().list()).toEqual(['https://films.example']);
  });

  it('keeps an address once, however often it is refused', () => {
    theRefusedOrigins().add('https://films.example');
    theRefusedOrigins().add('https://films.example');

    expect(theRefusedOrigins().list()).toEqual(['https://films.example']);
  });

  it('keeps the sixteen most recent, as many as a session request may name', () => {
    for (let at = 0; at < 20; at += 1) {
      theRefusedOrigins().add(`https://server-${at.toString()}.example`);
    }

    expect(theRefusedOrigins().list()).toHaveLength(16);
    expect(theRefusedOrigins().has('https://server-19.example')).toBe(true);
    expect(theRefusedOrigins().has('https://server-3.example')).toBe(false);
  });
});
