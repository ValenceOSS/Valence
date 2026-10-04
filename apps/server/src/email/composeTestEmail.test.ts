import { describe, expect, it } from 'vitest';
import { composeTestEmail } from './composeTestEmail';

describe('composeTestEmail', () => {
  it('says email works, from which server, with nothing to press', () => {
    expect(composeTestEmail('Home')).toEqual({
      subject: 'Email from Valence works',
      heading: 'Email from Valence works',
      paragraphs: [
        'This is a test email sent from Settings on Home. If you can read it, Valence can send email.',
      ],
      action: null,
      afterAction: [],
    });
  });
});
