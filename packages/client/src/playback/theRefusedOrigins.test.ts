import { describe, expect, it } from 'vitest';
import { theRefusedOrigins } from './theRefusedOrigins';

describe('theRefusedOrigins', () => {
  it('keeps what was refused for as long as the page is open', () => {
    theRefusedOrigins().add('https://films.example');

    expect(theRefusedOrigins().has('https://films.example')).toBe(true);
  });
});
