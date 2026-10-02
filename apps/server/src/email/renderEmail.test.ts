import { describe, expect, it } from 'vitest';
import { renderEmail } from './renderEmail';

const CONTENT = {
  subject: 'Your account on Home',
  heading: 'Welcome, <Ada>',
  paragraphs: ['Tom & Jerry made you an account.'],
  action: { label: 'Set up your account', url: 'https://v.example/setup?a=1&b="2"' },
  afterAction: ['The link works once.'],
};

describe('renderEmail', () => {
  it('says everything in plain text, link written out, signed', () => {
    const { subject, text } = renderEmail(CONTENT, 'Home');

    expect(subject).toBe('Your account on Home');
    expect(text).toBe(
      [
        'Welcome, <Ada>',
        'Tom & Jerry made you an account.',
        'Set up your account:\nhttps://v.example/setup?a=1&b="2"',
        'The link works once.',
        'Sent by Valence at Home.',
      ].join('\n\n'),
    );
  });

  it('says the same in HTML with everything escaped', () => {
    const { html } = renderEmail(CONTENT, 'Home');

    expect(html).toContain('Welcome, &lt;Ada&gt;');
    expect(html).toContain('Tom &amp; Jerry');
    expect(html).toContain('href="https://v.example/setup?a=1&amp;b=&quot;2&quot;"');
    expect(html).toContain('If the button does not work');
    expect(html).not.toContain('<Ada>');
  });

  it('leaves the button out of an email with nothing to press', () => {
    const { text, html } = renderEmail({ ...CONTENT, action: null }, 'Home');

    expect(text).not.toContain('https://');
    expect(html).not.toContain('<a ');
  });
});
