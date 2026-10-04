import { describe, expect, it } from 'vitest';
import { sayAgain } from './sayAgain';
import { saying } from './saying';
import { sayingCount } from './sayingCount';
import { sayVerbatim } from './sayVerbatim';

describe('sayAgain', () => {
  it('says a known code in this app’s own words', () => {
    expect(
      sayAgain({ code: 'error.common.nobodyIsSignedIn', message: 'Stale words', values: {} }),
    ).toBe('You’re not signed in.');
  });

  it('shows the server’s English for a code this app does not know', () => {
    expect(sayAgain({ code: 'from.a.newer.server', message: 'Something new', values: {} })).toBe(
      'Something new',
    );
  });

  it('shows words that came from elsewhere as they came', () => {
    expect(sayAgain(sayVerbatim('disk full'))).toBe('disk full');
  });

  it('says what was said inside it again as well', () => {
    expect(
      sayAgain(
        saying('requests.downloads.clientSaid', {
          name: 'NZBGet',
          said: saying('common.noReasonGiven'),
        }),
      ),
    ).toBe('NZBGet said: no reason given');
  });

  it('picks the form for however many were counted', () => {
    expect(sayAgain(sayingCount('common.count.episodes', 1))).toBe('1 episode');
    expect(sayAgain(sayingCount('common.count.episodes', 3))).toBe('3 episodes');
  });
});
