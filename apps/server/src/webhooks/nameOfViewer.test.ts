import { describe, expect, it } from 'vitest';
import { nameOfViewer } from './nameOfViewer';

describe('nameOfViewer', () => {
  it('names the profile and the household it belongs to', () => {
    expect(nameOfViewer({ accountName: 'Dan', profileName: 'Connie' })).toBe('Connie from Dan');
  });

  it('names the profile alone where it shares its household’s name', () => {
    expect(nameOfViewer({ accountName: 'Dan', profileName: 'Dan' })).toBe('Dan');
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
      'Someone with a share link',
    );
  });

  it('names somebody on a linked server by that server where it keeps their name back', () => {
    expect(
      nameOfViewer({ accountName: null, profileName: null, fromServer: 'Kai’s Valence' }),
    ).toBe('Someone from Kai’s Valence');
  });

  it('names somebody on a linked server and their server where it sends their name', () => {
    expect(
      nameOfViewer({ accountName: null, profileName: 'Sam', fromServer: 'Kai’s Valence' }),
    ).toBe('Sam from Kai’s Valence');
  });

  it('treats a guest of nobody as a guest of nobody rather than erroring', () => {
    expect(nameOfViewer({ accountName: null, profileName: null, guestOf: null })).toBe(
      'Someone with a share link',
    );
  });
});
