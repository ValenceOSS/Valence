import { describe, expect, it } from 'vitest';
import { nameOfViewer } from './nameOfViewer';

describe('nameOfViewer', () => {
  it('prefers the profile, because that is who picked it', () => {
    expect(nameOfViewer({ accountName: 'Dan', profileName: 'Connie' })).toBe('Connie');
  });

  it('falls back to the account where no profile was chosen', () => {
    expect(nameOfViewer({ accountName: 'Dan', profileName: null })).toBe('Dan');
  });

  it('names whoever shared the link where there is neither', () => {
    expect(nameOfViewer({ accountName: null, profileName: null, guestOf: 'Dan' })).toBe(
      'A guest of Dan',
    );
  });

  it('says what little it knows where even the link says nothing', () => {
    expect(nameOfViewer({ accountName: null, profileName: null })).toBe(
      'Somebody with a share link',
    );
  });

  it('treats a guest of nobody as a guest of nobody rather than erroring', () => {
    expect(nameOfViewer({ accountName: null, profileName: null, guestOf: null })).toBe(
      'Somebody with a share link',
    );
  });
});
