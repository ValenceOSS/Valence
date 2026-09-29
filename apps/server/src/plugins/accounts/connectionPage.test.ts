import { describe, expect, it } from 'vitest';
import { connectionPage } from './connectionPage';

describe('connectionPage', () => {
  it('says what happened and what to do next', () => {
    const page = connectionPage('Connected', 'You can close this and return to Valence.');

    expect(page).toContain('<title>Connected</title>');
    expect(page).toContain('<h1 style="font-size: 1.25rem">Connected</h1>');
    expect(page).toContain('<p>You can close this and return to Valence.</p>');
  });

  it('escapes whatever it is told, so a provider name cannot become markup', () => {
    const page = connectionPage('<script>alert(1)</script>', `"Evil" & 'co' <b>`);

    expect(page).not.toContain('<script>');
    expect(page).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(page).toContain('&quot;Evil&quot; &amp; &#39;co&#39; &lt;b&gt;');
  });

  it('carries no script, picture or colour of its own', () => {
    const page = connectionPage('Connected', 'Done.');

    expect(page).not.toMatch(/<script|<img|<link|color:|background/i);
  });
});
